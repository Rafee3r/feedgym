import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// POST /api/posts/[id]/like - Toggle like
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const userId = session.user.id

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true, authorId: true },
        })

        if (!post) {
            return NextResponse.json({ error: "Post no encontrado" }, { status: 404 })
        }

        // Check if already liked
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: { userId, postId },
            },
        })

        if (existingLike) {
            // Unlike
            await prisma.$transaction([
                prisma.like.delete({
                    where: { id: existingLike.id },
                }),
                prisma.post.update({
                    where: { id: postId },
                    data: { likesCount: { decrement: 1 } },
                }),
            ])

            return NextResponse.json({ liked: false })
        } else {
            // Like
            await prisma.$transaction([
                prisma.like.create({
                    data: { userId, postId },
                }),
                prisma.post.update({
                    where: { id: postId },
                    data: { likesCount: { increment: 1 } },
                }),
            ])

            // Create notification if not liking own post
            if (post.authorId !== userId) {
                await prisma.notification.create({
                    data: {
                        type: "LIKE",
                        recipientId: post.authorId,
                        actorId: userId,
                        postId,
                    },
                })
            }

            return NextResponse.json({ liked: true })
        }
    } catch (error) {
        console.error("Like error:", error)
        return NextResponse.json(
            { error: "Error al dar like" },
            { status: 500 }
        )
    }
}
