import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// POST /api/posts/[id]/bookmark - Toggle bookmark
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
            select: { id: true },
        })

        if (!post) {
            return NextResponse.json({ error: "Post no encontrado" }, { status: 404 })
        }

        // Check if already bookmarked
        const existingBookmark = await prisma.bookmark.findUnique({
            where: {
                userId_postId: { userId, postId },
            },
        })

        if (existingBookmark) {
            // Remove bookmark
            await prisma.bookmark.delete({
                where: { id: existingBookmark.id },
            })

            return NextResponse.json({ bookmarked: false })
        } else {
            // Add bookmark
            await prisma.bookmark.create({
                data: { userId, postId },
            })

            return NextResponse.json({ bookmarked: true })
        }
    } catch (error) {
        console.error("Bookmark error:", error)
        return NextResponse.json(
            { error: "Error al guardar" },
            { status: 500 }
        )
    }
}
