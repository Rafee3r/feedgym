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

        // Get replies
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

        const formattedReplies = replies.map((reply) => ({
            id: reply.id,
            content: reply.content,
            imageUrl: reply.imageUrl,
            type: reply.type,
            metadata: reply.metadata,
            likesCount: reply.likesCount,
            repliesCount: reply.repliesCount,
            author: reply.author,
            createdAt: reply.createdAt,
            isLiked: session ? ((reply as { likes?: { id: string }[] }).likes?.length ?? 0) > 0 : false,
            isBookmarked: session ? ((reply as { bookmarks?: { id: string }[] }).bookmarks?.length ?? 0) > 0 : false,
        }))

        return NextResponse.json({
            post: {
                id: post.id,
                content: post.content,
                imageUrl: post.imageUrl,
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
            },
            replies: formattedReplies,
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

        if (post.authorId !== session.user.id) {
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
