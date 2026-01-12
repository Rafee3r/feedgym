
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

// Map day index to English day name (matching trainingDays format)
const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
]

// Get current date in Santiago, Chile timezone
function getSantiagoDate(): Date {
    const now = new Date()
    const santiagoString = now.toLocaleString("en-US", { timeZone: "America/Santiago" })
    return new Date(santiagoString)
}

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

        // Use Santiago timezone for determining current date and week
        const santiagoNow = getSantiagoDate()

        // Get start and end of current week (starting Monday)
        const weekStart = startOfWeek(santiagoNow, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(santiagoNow, { weekStartsOn: 1 })

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

        // Map days to status - use day NAMES to match trainingDays format
        const trainingDays = user?.trainingDays || []

        const activity = days.map((day) => {
            const hasPost = posts.some(
                (post) =>
                    post.createdAt.getDate() === day.getDate() &&
                    post.createdAt.getMonth() === day.getMonth() &&
                    post.createdAt.getFullYear() === day.getFullYear()
            )

            // Get day name to match against trainingDays (which stores names like "Monday")
            const dayName = DAY_NAMES[day.getDay()]

            return {
                date: day.toISOString(),
                hasPost,
                isToday:
                    day.getDate() === santiagoNow.getDate() &&
                    day.getMonth() === santiagoNow.getMonth() &&
                    day.getFullYear() === santiagoNow.getFullYear(),
                isPast: day < santiagoNow,
                dayName, // Include dayName for frontend debugging
            }
        })

        // Count only scheduled training days that have a post (true consistency!)
        const daysPosted = activity.filter(d => {
            const dayName = DAY_NAMES[new Date(d.date).getDay()]
            const isScheduled = trainingDays.includes(dayName)
            return isScheduled && d.hasPost
        }).length

        // Check if today is a scheduled training day
        const todayDayName = DAY_NAMES[santiagoNow.getDay()]
        const isScheduledToday = trainingDays.includes(todayDayName)

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
