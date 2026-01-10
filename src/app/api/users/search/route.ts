import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get("q")?.trim()

        if (!query || query.length < 1) {
            return NextResponse.json({ users: [] })
        }

        // Search users by username or displayName
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: "insensitive" } },
                    { displayName: { contains: query, mode: "insensitive" } },
                ],
                discoverable: true,
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
            },
            take: 5,
            orderBy: [
                { username: "asc" },
            ],
        })

        // Always include IRON as a special suggestion if query matches
        const ironMatches = "iron".includes(query.toLowerCase())
        const suggestions = ironMatches
            ? [
                { id: "iron", username: "IRON", displayName: "IRON AI Coach", avatarUrl: null, isBot: true },
                ...users
            ]
            : users

        return NextResponse.json({ users: suggestions.slice(0, 5) })
    } catch (error) {
        console.error("User search error:", error)
        return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }
}
