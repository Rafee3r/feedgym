
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const now = new Date()
        // Get start and end of current week (starting Monday)
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

        // Get all days in the week
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

        // Fetch posts for this week
        const posts = await prisma.post.findMany({
            where: {
                authorId: session.user.id,
                createdAt: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
            select: {
                createdAt: true,
                type: true,
            },
        })

        // Map days to status
        const activity = days.map((day) => {
            const hasPost = posts.some(
                (post) =>
                    post.createdAt.getDate() === day.getDate() &&
                    post.createdAt.getMonth() === day.getMonth() &&
                    post.createdAt.getFullYear() === day.getFullYear()
            )
            return {
                date: day.toISOString(),
                hasPost,
                isToday:
                    day.getDate() === now.getDate() &&
                    day.getMonth() === now.getMonth() &&
                    day.getFullYear() === now.getFullYear(),
                isPast: day < now,
            }
        })

        const daysPosted = activity.filter(d => d.hasPost).length
        const missedToday = activity.find(d => d.isToday && !d.hasPost)

        return NextResponse.json({
            weekDays: activity,
            stats: {
                daysPosted,
                totalDoays: 7,
                missedToday: !!missedToday
            }
        })
    } catch (error) {
        console.error("Activity API Error:", error)
        return NextResponse.json(
            { error: "Error al obtener actividad" },
            { status: 500 }
        )
    }
}
