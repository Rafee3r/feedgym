import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/users/suggested - Get suggested users to follow (most active first)
export async function GET() {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Get IDs of users the current user already follows
        const following = await prisma.follow.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        })
        const followingIds = following.map(f => f.followingId)

        // Get users not already followed, with post and like counts
        const suggestedUsers = await prisma.user.findMany({
            where: {
                id: {
                    notIn: [session.user.id, ...followingIds],
                },
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                _count: {
                    select: {
                        posts: true,
                        likes: true,
                    },
                },
            },
            take: 10,
        })

        // Sort by activity (posts + likes) and take top 5
        const sortedUsers = suggestedUsers
            .map(user => ({
                id: user.id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                isFollowing: false,
                activityScore: user._count.posts + user._count.likes,
            }))
            .sort((a, b) => b.activityScore - a.activityScore)
            .slice(0, 5)
            .map(({ activityScore, ...user }) => user)

        return NextResponse.json(sortedUsers)
    } catch (error) {
        console.error("Error fetching suggested users:", error)
        return NextResponse.json(
            { error: "Error al obtener usuarios sugeridos" },
            { status: 500 }
        )
    }
}
