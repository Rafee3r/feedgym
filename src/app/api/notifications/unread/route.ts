import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ unreadCount: 0 })
        }

        const unreadCount = await prisma.notification.count({
            where: {
                recipientId: session.user.id,
                read: false,
            },
        })

        return NextResponse.json({ unreadCount })
    } catch (error) {
        console.error("Error fetching unread count:", error)
        return NextResponse.json({ unreadCount: 0 })
    }
}
