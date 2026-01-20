
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

        // Helper to convert UTC date to Santiago timezone date components
        function getDateInSantiago(utcDate: Date): { date: number, month: number, year: number } {
            const santiagoString = utcDate.toLocaleString("en-US", { timeZone: "America/Santiago" })
            const d = new Date(santiagoString)
            return { date: d.getDate(), month: d.getMonth(), year: d.getFullYear() }
        }

        const activity = days.map((day) => {
            const dayInSantiago = getDateInSantiago(day)

            const hasPost = posts.some((post) => {
                const postInSantiago = getDateInSantiago(post.createdAt)
                return (
                    postInSantiago.date === dayInSantiago.date &&
                    postInSantiago.month === dayInSantiago.month &&
                    postInSantiago.year === dayInSantiago.year
                )
            })

            // Get day name in SANTIAGO timezone to match against trainingDays
            const santiagoDateStr = day.toLocaleString("en-US", { timeZone: "America/Santiago", weekday: "long" })
            // toLocaleString with weekday returns the day name directly
            const dayName = santiagoDateStr.split(",")[0] || DAY_NAMES[day.getDay()]

            return {
                date: day.toISOString(),
                hasPost,
                isToday:
                    dayInSantiago.date === santiagoNow.getDate() &&
                    dayInSantiago.month === santiagoNow.getMonth() &&
                    dayInSantiago.year === santiagoNow.getFullYear(),
                isPast: day < santiagoNow,
                dayName, // Include dayName for frontend debugging
            }
        })

        // Count only scheduled training days that have a post (true consistency!)
        const daysPosted = activity.filter(d => {
            // Use the dayName we already calculated and included in the response
            const dayDate = new Date(d.date)
            const santiagoDay = dayDate.toLocaleString("en-US", { timeZone: "America/Santiago", weekday: "long" }).split(",")[0]
            const isScheduled = trainingDays.includes(santiagoDay)
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
