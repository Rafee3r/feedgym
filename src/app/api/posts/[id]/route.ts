import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/posts/[id] - Get single post with replies
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        const post = await prisma.post.findUnique({
            where: { id, deletedAt: null },
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
                parent: {
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

        if (!post) {
            return NextResponse.json({ error: "Post no encontrado" }, { status: 404 })
        }

        // Get replies (Level 1) causing recursion for Level 2
        const replies = await prisma.post.findMany({
            where: { parentId: id, deletedAt: null },
            orderBy: { createdAt: "asc" },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                // Include Level 2 replies
                replies: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true,
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
                    }
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

        // Helper to format post/reply
        const formatPost = (p: any) => ({
            id: p.id,
            content: p.content,
            imageUrl: p.imageUrl,
            mediaUrls: p.mediaUrls,
            type: p.type,
            metadata: p.metadata,
            likesCount: p.likesCount,
            repliesCount: p.repliesCount,
            author: p.author,
            createdAt: p.createdAt,
            isLiked: session ? (p.likes?.length ?? 0) > 0 : false,
            isBookmarked: session ? (p.bookmarks?.length ?? 0) > 0 : false,
            // Recursively format nested replies if they exist
            replies: p.replies ? p.replies.map(formatPost) : []
        })

        const formattedReplies = replies.map(formatPost)

        return NextResponse.json({
            post: {
                id: post.id,
                content: post.content,
                imageUrl: post.imageUrl,
                mediaUrls: (post as any).mediaUrls,
                type: post.type,
                metadata: post.metadata,
                audience: post.audience,
                parentId: post.parentId,
                threadRootId: post.threadRootId,
                repostOfId: post.repostOfId,
                isQuote: post.isQuote,
                likesCount: post.likesCount,
                repliesCount: post.repliesCount,
                repostsCount: post.repostsCount,
                author: post.author,
                createdAt: post.createdAt,
                isLiked: session ? ((post as { likes?: { id: string }[] }).likes?.length ?? 0) > 0 : false,
                isBookmarked: session ? ((post as { bookmarks?: { id: string }[] }).bookmarks?.length ?? 0) > 0 : false,
                repostOf: post.repostOf,
                parent: post.parent,
                canDelete: session ? (session.user.id === post.authorId || session.user.role === "ADMIN" || session.user.role === "STAFF") : false,
            },
            replies: formattedReplies.map(reply => ({
                ...reply,
                canDelete: session ? (session.user.id === reply.author.id || session.user.role === "ADMIN" || session.user.role === "STAFF") : false,
                replies: reply.replies.map((nested: any) => ({
                    ...nested,
                    canDelete: session ? (session.user.id === nested.author.id || session.user.role === "ADMIN" || session.user.role === "STAFF") : false,
                }))
            })),
        })
    } catch (error) {
        console.error("Get post error:", error)
        return NextResponse.json(
            { error: "Error al obtener post" },
            { status: 500 }
        )
    }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const post = await prisma.post.findUnique({
            where: { id },
            select: { authorId: true, parentId: true },
        })

        if (!post) {
            return NextResponse.json({ error: "Post no encontrado" }, { status: 404 })
        }

        const isAuthorized = post.authorId === session.user.id ||
            session.user.role === "ADMIN" ||
            session.user.role === "STAFF";

        if (!isAuthorized) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        // Soft delete
        await prisma.post.update({
            where: { id },
            data: { deletedAt: new Date() },
        })

        // Update parent's reply count
        if (post.parentId) {
            await prisma.post.update({
                where: { id: post.parentId },
                data: { repliesCount: { decrement: 1 } },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete post error:", error)
        return NextResponse.json(
            { error: "Error al eliminar post" },
            { status: 500 }
        )
    }
}
