import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { postSchema } from "@/lib/validations"
import { parseMentions, sendPushNotification } from "@/lib/push"
import { updateUserStreak } from "@/lib/streaks"
import { buildUserContext, IRON_SYSTEM_PROMPT } from "@/lib/coach-prompt"
import { getOpenAI } from "@/lib/openai"

// IRON Bot ID - we'll use a special constant for identifying IRON's replies
const IRON_BOT_DISPLAY_NAME = "IRON"
const IRON_BOT_AVATAR = null // Will show "I" fallback

// Generate IRON's reply to a post mentioning @IRON
async function generateIronReply(postId: string, postContent: string, userId: string) {
    try {
        // Get or create IRON bot user
        let ironUser = await prisma.user.findFirst({
            where: { username: "IRON" }
        })

        if (!ironUser) {
            // Create IRON bot user if doesn't exist
            ironUser = await prisma.user.create({
                data: {
                    email: "iron@feedgym.bot",
                    username: "IRON",
                    displayName: "IRON",
                    bio: "Soy IRON. No busco caerte bien. Busco que progreses.",
                    avatarUrl: null,
                    goal: "MAINTAIN",
                    onboardingCompleted: true,
                }
            })
        }

        // Get the post where IRON was mentioned
        const mentionPost = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: { select: { displayName: true, username: true } }
            }
        })

        if (!mentionPost) return

        // Get the thread root ID (original post)
        const threadRootId = mentionPost.threadRootId || postId

        // Fetch the entire thread: root post + all replies in order
        const threadPosts = await prisma.post.findMany({
            where: {
                OR: [
                    { id: threadRootId },
                    { threadRootId: threadRootId }
                ],
                deletedAt: null
            },
            include: {
                author: { select: { displayName: true, username: true } }
            },
            orderBy: { createdAt: "asc" }
        })

        // Build thread context for IRON
        const threadContext = threadPosts.map((post, idx) => {
            const isRoot = post.id === threadRootId
            const isMention = post.id === postId
            return `[${idx + 1}] @${post.author.username} (${post.author.displayName})${isRoot ? " [POST ORIGINAL]" : ""}${isMention ? " [TE MENCIONÓ]" : ""}:\n"${post.content}"`
        }).join("\n\n")

        // Build context for the user who mentioned IRON
        const userContext = await buildUserContext(userId)

        // Generate response using OpenAI with full thread context
        const openai = getOpenAI()
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: IRON_SYSTEM_PROMPT },
                { role: "system", content: `CONTEXTO DEL USUARIO QUE TE MENCIONÓ:\n${userContext}` },
                { role: "user", content: `HILO COMPLETO DE LA CONVERSACIÓN:\n\n${threadContext}\n\n---\n\nEl usuario @${mentionPost.author.username} te mencionó en este hilo. Lee todo el contexto y responde al mensaje donde te mencionaron. Responde brevemente (máximo 100 palabras). Mantén tu personalidad fría y directa.` }
            ],
            max_tokens: 200,
        })

        const ironResponse = completion.choices[0]?.message?.content?.trim()
        if (!ironResponse) return

        // Create IRON's reply post
        await prisma.post.create({
            data: {
                content: ironResponse,
                type: "NOTE",
                parentId: postId,
                threadRootId: threadRootId,
                authorId: ironUser.id,
                audience: "PUBLIC",
            }
        })

        // Update reply count on parent
        await prisma.post.update({
            where: { id: postId },
            data: { repliesCount: { increment: 1 } }
        })

    } catch (error) {
        console.error("IRON auto-reply error:", error)
    }
}

// GET /api/posts - Get feed posts
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        const { searchParams } = new URL(request.url)

        const cursor = searchParams.get("cursor")
        const limit = parseInt(searchParams.get("limit") || "20")
        const userId = searchParams.get("userId")
        const onlyMedia = searchParams.get("onlyMedia") === "true"
        const onlyReplies = searchParams.get("onlyReplies") === "true"

        const where: any = {
            deletedAt: null,
            ...(userId && { authorId: userId }),
            // Shadowban filter: Hide shadowbanned authors unless own profile or admin
            ...((!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) && {
                author: {
                    isShadowbanned: false
                }
            })
        }

        if (onlyReplies) {
            where.parentId = { not: null }
        } else if (onlyMedia) {
            where.OR = [
                { imageUrl: { not: null } },
                { mediaUrls: { isEmpty: false } } // Works for PostgreSQL with Prisma
            ]
            // Usually for media tab we show everything (posts + replies with media), 
            // but typically users expect "My Media" to be posts they made. 
            // Let's include replies with media too.
        } else {
            // Default "Posts" tab behavior: Only root posts (no replies)
            where.parentId = null
        }

        const posts = await prisma.post.findMany({
            where,
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                repostOf: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                ...(session && {
                    likes: {
                        where: { userId: session.user.id },
                        select: { id: true },
                    },
                    bookmarks: {
                        where: { userId: session.user.id },
                        select: { id: true },
                    },
                }),
            },
        })

        const hasMore = posts.length > limit
        const postsToReturn = hasMore ? posts.slice(0, -1) : posts

        const formattedPosts = postsToReturn.map((post) => {
            const p = post as any // Cast to any because local Prisma client is stale
            return {
                id: p.id,
                content: p.content,
                imageUrl: p.imageUrl,
                mediaUrls: p.mediaUrls,
                type: p.type,
                metadata: p.metadata,
                audience: p.audience,
                parentId: p.parentId,
                threadRootId: p.threadRootId,
                repostOfId: p.repostOfId,
                isQuote: p.isQuote,
                likesCount: p.likesCount,
                repliesCount: p.repliesCount,
                repostsCount: p.repostsCount,
                author: p.author,
                createdAt: p.createdAt,
                isLiked: session ? ((p as { likes?: { id: string }[] }).likes?.length ?? 0) > 0 : false,
                isBookmarked: session ? ((p as { bookmarks?: { id: string }[] }).bookmarks?.length ?? 0) > 0 : false,
                repostOf: p.repostOf,
                topReply: null as null | { id: string; content: string; author: { id: string; username: string; displayName: string; avatarUrl: string | null }; likesCount: number; createdAt: Date },
                canDelete: session ? (session.user.id === p.author.id || session.user.role === "ADMIN" || session.user.role === "STAFF") : false,
            }
        })

        // Fetch top replies for posts that have replies
        const postsWithReplies = formattedPosts.filter(p => p.repliesCount > 0)
        if (postsWithReplies.length > 0) {
            const topReplies = await prisma.post.findMany({
                where: {
                    parentId: { in: postsWithReplies.map(p => p.id) },
                    deletedAt: null,
                },
                orderBy: { likesCount: "desc" },
                take: postsWithReplies.length * 1, // One per parent
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatarUrl: true,
                        },
                    },
                },
            })

            // Group by parentId and take top one
            const topReplyMap = new Map<string, typeof topReplies[0]>()
            for (const reply of topReplies) {
                if (reply.parentId && !topReplyMap.has(reply.parentId)) {
                    topReplyMap.set(reply.parentId, reply)
                }
            }

            // Attach to posts
            for (const post of formattedPosts) {
                const topReply = topReplyMap.get(post.id)
                if (topReply) {
                    post.topReply = {
                        id: topReply.id,
                        content: topReply.content,
                        author: topReply.author,
                        likesCount: topReply.likesCount,
                        createdAt: topReply.createdAt,
                    }
                }
            }
        }

        return NextResponse.json({
            posts: formattedPosts,
            nextCursor: hasMore ? posts[posts.length - 2]?.id : null,
            hasMore,
        })
    } catch (error) {
        console.error("Get posts error:", error)
        return NextResponse.json(
            { error: "Error al obtener posts" },
            { status: 500 }
        )
    }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const validated = postSchema.safeParse(body)

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.errors[0].message },
                { status: 400 }
            )
        }

        // Admin Enforcement - Fetch fresh status from DB
        const userStatus = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isBanned: true, isFrozen: true, mutedUntil: true }
        }) as any // Cast to any because local Prisma client might be stale and locked

        if (!userStatus) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }

        if (userStatus.isBanned) {
            return NextResponse.json({ error: "Tu cuenta ha sido suspendida permanentemente." }, { status: 403 })
        }
        if (userStatus.isFrozen) {
            return NextResponse.json({ error: "Tu cuenta está congelada (solo lectura)." }, { status: 403 })
        }
        if (userStatus.mutedUntil && new Date(userStatus.mutedUntil) > new Date()) {
            const minutes = Math.ceil((new Date(userStatus.mutedUntil).getTime() - Date.now()) / 60000)
            return NextResponse.json({ error: `Estás silenciado. Podrás publicar en ${minutes} minutos.` }, { status: 403 })
        }

        const { content, type, imageUrl, parentId, audience, metadata } = validated.data

        // If this is a reply, check if parent exists
        let threadRootId = null
        if (parentId) {
            const parentPost = await prisma.post.findUnique({
                where: { id: parentId },
                select: { id: true, threadRootId: true, authorId: true },
            })

            if (!parentPost) {
                return NextResponse.json(
                    { error: "Post padre no encontrado" },
                    { status: 404 }
                )
            }

            // Set thread root
            threadRootId = parentPost.threadRootId || parentPost.id
        }

        // Create post
        const post = await prisma.post.create({
            data: {
                content,
                type,
                imageUrl,
                mediaUrls: (validated.data as any).mediaUrls, // Cast for stale client
                parentId,
                threadRootId,
                audience,
                metadata: metadata || undefined,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        })

        // Update user's streak (for consistency tracking)
        updateUserStreak(session.user.id)

        // Update parent's reply count if this is a reply
        if (parentId) {
            await prisma.post.update({
                where: { id: parentId },
                data: { repliesCount: { increment: 1 } },
            })

            // Create notification for parent author
            const parentPost = await prisma.post.findUnique({
                where: { id: parentId },
                select: { authorId: true },
            })

            if (parentPost && parentPost.authorId !== session.user.id) {
                await prisma.notification.create({
                    data: {
                        type: "REPLY",
                        recipientId: parentPost.authorId,
                        actorId: session.user.id,
                        postId: post.id,
                    },
                })

                // Send push for reply
                sendPushNotification(parentPost.authorId, {
                    title: `${(session.user as any).displayName || session.user.username} respondió`,
                    body: content.slice(0, 100),
                    url: `/post/${post.id}`
                })
            }
        }

        // Handle mentions
        const mentionedUsernames = parseMentions(content)
        if (mentionedUsernames.length > 0) {
            // Find mentioned users
            const mentionedUsers = await prisma.user.findMany({
                where: {
                    username: { in: mentionedUsernames },
                    id: { not: session.user.id } // Don't notify yourself
                },
                select: { id: true, username: true }
            })

            // Create notification and send push for each
            for (const user of mentionedUsers) {
                await prisma.notification.create({
                    data: {
                        type: "MENTION",
                        recipientId: user.id,
                        actorId: session.user.id,
                        postId: post.id,
                    },
                })

                sendPushNotification(user.id, {
                    title: `${(session.user as any).displayName || session.user.username} te mencionó`,
                    body: content.slice(0, 100),
                    url: `/post/${post.id}`
                })
            }
        }

        // IRON Auto-Reply: If @IRON is mentioned, generate and post a reply
        const ironMentioned = mentionedUsernames.some(u => u.toUpperCase() === "IRON")
        if (ironMentioned) {
            // Fire and forget - don't block the response
            generateIronReply(post.id, content, session.user.id).catch(console.error)
        }

        return NextResponse.json(
            {
                id: post.id,
                content: post.content,
                imageUrl: post.imageUrl,
                mediaUrls: post.mediaUrls,
                type: post.type,
                metadata: post.metadata,
                audience: post.audience,
                parentId: post.parentId,
                threadRootId: post.threadRootId,
                likesCount: 0,
                repliesCount: 0,
                repostsCount: 0,
                author: post.author,
                createdAt: post.createdAt,
                isLiked: false,
                isBookmarked: false,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Create post error:", error)
        return NextResponse.json(
            { error: "Error al crear post" },
            { status: 500 }
        )
    }
}
