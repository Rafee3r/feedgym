import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "20")
        const cursor = searchParams.get("cursor")

        const notifications = await prisma.notification.findMany({
            where: { recipientId: session.user.id },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { createdAt: "desc" },
            include: {
                actor: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
                post: {
                    select: {
                        id: true,
                        content: true,
                    },
                },
            },
        })

        const hasMore = notifications.length > limit
        const notificationsToReturn = hasMore
            ? notifications.slice(0, -1)
            : notifications

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: { recipientId: session.user.id, read: false },
        })

        return NextResponse.json({
            notifications: notificationsToReturn.map((n) => ({
                id: n.id,
                type: n.type,
                read: n.read,
                actor: n.actor,
                post: n.post,
                createdAt: n.createdAt,
            })),
            unreadCount,
            nextCursor: hasMore
                ? notifications[notifications.length - 2]?.id
                : null,
            hasMore,
        })
    } catch (error) {
        console.error("Get notifications error:", error)
        return NextResponse.json(
            { error: "Error al obtener notificaciones" },
            { status: 500 }
        )
    }
}

// PATCH /api/notifications - Mark all as read
export async function PATCH() {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        await prisma.notification.updateMany({
            where: { recipientId: session.user.id, read: false },
            data: { read: true },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Mark read error:", error)
        return NextResponse.json(
            { error: "Error al marcar como leídas" },
            { status: 500 }
        )
    }
}
