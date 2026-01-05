
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

        const { searchParams } = new URL(request.url)
        const userIdParam = searchParams.get("userId")
        const targetUserId = userIdParam || session.user.id

        // Verify if user exists (optional, but good for safety)
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { trainingDays: true }
        })

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
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
                authorId: targetUserId,
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

        const trainingDays = user?.trainingDays || []

        const daysPosted = activity.filter(d => d.hasPost).length

        // Check if today is a scheduled training day
        const todayIndex = now.getDay().toString()
        const isScheduledToday = trainingDays.includes(todayIndex)

        const missedToday = activity.find(d => d.isToday && !d.hasPost) && isScheduledToday

        return NextResponse.json({
            weekDays: activity,
            trainingDays: trainingDays,
            stats: {
                daysPosted,
                totalDoays: 7,
                scheduledTarget: trainingDays.length,
                missedToday: !!missedToday,
                scheduledToday: isScheduledToday
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
