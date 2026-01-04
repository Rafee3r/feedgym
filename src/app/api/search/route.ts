import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/search - Search users and posts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get("q")

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ users: [], posts: [] })
        }

        const searchTerm = query.trim()

        // Search users
        const users = await prisma.user.findMany({
            where: {
                discoverable: true,
                OR: [
                    { username: { contains: searchTerm, mode: "insensitive" } },
                    { displayName: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
            },
            take: 10,
        })

        // Search posts (simple text search)
        const posts = await prisma.post.findMany({
            where: {
                deletedAt: null,
                content: { contains: searchTerm, mode: "insensitive" },
                audience: "PUBLIC",
            },
            select: {
                id: true,
                content: true,
                author: {
                    select: {
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
            take: 20,
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ users, posts })
    } catch (error) {
        console.error("Search error:", error)
        return NextResponse.json(
            { error: "Error al buscar" },
            { status: 500 }
        )
    }
}
