import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

/**
 * GET /api/users/me/summary
 * Combined endpoint that returns user data, notification count, and ban status
 * in a single request to reduce API calls and database queries.
 */
export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            )
        }

        // Batch all queries in parallel
        const [user, unreadCount] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    bio: true,
                    avatarUrl: true,
                    bannerUrl: true,
                    location: true,
                    website: true,
                    pronouns: true,
                    gymSplit: true,
                    trainingDays: true,
                    goal: true,
                    targetWeight: true,
                    caloriesTarget: true,
                    proteinTarget: true,
                    carbsTarget: true,
                    fatsTarget: true,
                    accountPrivacy: true,
                    allowDMs: true,
                    showMetrics: true,
                    discoverable: true,
                    createdAt: true,
                    isBanned: true,
                },
            }),
            prisma.notification.count({
                where: {
                    recipientId: session.user.id,
                    read: false,
                },
            }),
        ])

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            )
        }

        const { isBanned, ...userData } = user

        return NextResponse.json(
            {
                user: userData,
                unreadNotifications: unreadCount,
                isBanned: isBanned ?? false,
            },
            {
                headers: {
                    "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
                },
            }
        )
    } catch (error) {
        console.error("Get user summary error:", error)
        return NextResponse.json(
            { error: "Error al obtener datos" },
            { status: 500 }
        )
    }
}
