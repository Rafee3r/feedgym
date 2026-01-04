import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// POST /api/posts/[id]/repost - Toggle repost
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Check if original post exists
        const originalPost = await prisma.post.findUnique({
            where: { id },
        })

        if (!originalPost) {
            return NextResponse.json({ error: "Post no encontrado" }, { status: 404 })
        }

        // Check if already reposted
        const existingRepost = await prisma.post.findFirst({
            where: {
                repostOfId: id,
                authorId: session.user.id,
                isQuote: false, // Pure repost
                deletedAt: null
            },
        })

        if (existingRepost) {
            // Un-repost (Delete)
            await prisma.post.update({
                where: { id: existingRepost.id },
                data: { deletedAt: new Date() },
            })

            // Decrement count
            await prisma.post.update({
                where: { id },
                data: { repostsCount: { decrement: 1 } },
            })

            return NextResponse.json({ reposted: false })
        } else {
            // Create Repost
            await prisma.post.create({
                data: {
                    content: "", // Empty content for pure repost
                    type: "NOTE",
                    authorId: session.user.id,
                    repostOfId: id,
                    isQuote: false,
                    audience: "PUBLIC",
                },
            })

            // Increment count
            await prisma.post.update({
                where: { id },
                data: { repostsCount: { increment: 1 } },
            })

            // Notification logic (optional for MVP but good to have)
            if (originalPost.authorId !== session.user.id) {
                await prisma.notification.create({
                    data: {
                        type: "REPOST",
                        recipientId: originalPost.authorId,
                        actorId: session.user.id,
                        postId: id, // Linking to original post? Or the new repost? usually original or null.
                        // For simplicity, let's skip complex notification linking if not strictly required.
                    }
                })
            }

            return NextResponse.json({ reposted: true })
        }
    } catch (error) {
        console.error("Repost error:", error)
        return NextResponse.json(
            { error: "Error al repostear" },
            { status: 500 }
        )
    }
}
