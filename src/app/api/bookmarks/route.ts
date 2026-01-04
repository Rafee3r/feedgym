import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/bookmarks - Get bookmarked posts for current user
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "20")

        const bookmarks = await prisma.bookmark.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                post: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                                avatarUrl: true,
                            },
                        },
                        likes: {
                            where: { userId: session.user.id },
                            select: { id: true },
                        },
                    },
                },
            },
        })

        const posts = bookmarks
            .filter((b) => b.post.deletedAt === null)
            .map((b) => ({
                id: b.post.id,
                content: b.post.content,
                imageUrl: b.post.imageUrl,
                type: b.post.type,
                metadata: b.post.metadata,
                likesCount: b.post.likesCount,
                repliesCount: b.post.repliesCount,
                repostsCount: b.post.repostsCount,
                author: b.post.author,
                createdAt: b.post.createdAt,
                isLiked: b.post.likes.length > 0,
                isBookmarked: true,
            }))

        return NextResponse.json({ posts })
    } catch (error) {
        console.error("Get bookmarks error:", error)
        return NextResponse.json(
            { error: "Error al obtener guardados" },
            { status: 500 }
        )
    }
}
