import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/users/suggested - Get suggested users to follow
export async function GET() {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Get users that the current user is NOT already following
        // Exclude the current user themselves
        const suggestedUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: session.user.id } },
                    {
                        followedBy: {
                            none: {
                                followerId: session.user.id,
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
            },
            take: 5,
            orderBy: {
                createdAt: "desc",
            },
        })

        // Add isFollowing flag (always false for suggested users)
        const usersWithFollowStatus = suggestedUsers.map(user => ({
            ...user,
            isFollowing: false,
        }))

        return NextResponse.json(usersWithFollowStatus)
    } catch (error) {
        console.error("Error fetching suggested users:", error)
        return NextResponse.json(
            { error: "Error al obtener usuarios sugeridos" },
            { status: 500 }
        )
    }
}
