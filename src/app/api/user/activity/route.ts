
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfWeek, endOfWeek, eachDayOfInterval, addHours } from "date-fns"

// Day names in Monday-first order (index 0 = Monday, 6 = Sunday)
// This matches our weekStartsOn: 1 configuration
const WEEKDAY_NAMES_MONDAY_FIRST = [
    "Monday",    // index 0
    "Tuesday",   // index 1
    "Wednesday", // index 2
    "Thursday",  // index 3
    "Friday",    // index 4
    "Saturday",  // index 5
    "Sunday"     // index 6
]

// Standard JS getDay() names (0 = Sunday, 6 = Saturday)
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
function getSantiagoNow(): Date {
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

        // Verify if user exists
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { trainingDays: true }
        })

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }

        // Use Santiago timezone for current date
        const santiagoNow = getSantiagoNow()

        // Get start and end of current week (starting Monday)
        const weekStart = startOfWeek(santiagoNow, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(santiagoNow, { weekStartsOn: 1 })

        // Get all days in the week - add 12 hours to avoid UTC midnight issues
        const rawDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
        const days = rawDays.map(d => addHours(d, 12)) // Move to noon to avoid timezone edge cases

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

        // Raw trainingDays from DB - might contain mixed formats (numbers and day names)
        const rawTrainingDays = user?.trainingDays || []

        // Filter to only valid day names (Monday, Tuesday, etc.)
        const validDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        const trainingDays = rawTrainingDays.filter(day =>
            typeof day === "string" && validDayNames.includes(day)
        )

        // Helper to compare dates in Santiago timezone
        function isSameDay(date1: Date, date2: Date): boolean {
            const d1str = date1.toLocaleDateString("en-US", { timeZone: "America/Santiago" })
            const d2str = date2.toLocaleDateString("en-US", { timeZone: "America/Santiago" })
            return d1str === d2str
        }

        const activity = days.map((day, index) => {
            // Use INDEX to determine day name since we know the week starts Monday
            // index 0 = Monday, index 1 = Tuesday, etc.
            const dayName = WEEKDAY_NAMES_MONDAY_FIRST[index]

            // Check if any post was made on this day
            const hasPost = posts.some((post) => isSameDay(post.createdAt, day))

            // Check if this day is today
            const isToday = isSameDay(day, santiagoNow)

            // Check if this day is in the past
            const isPast = day < santiagoNow && !isToday

            return {
                date: day.toISOString(),
                hasPost,
                isToday,
                isPast,
                dayName, // Correct day name based on week position
            }
        })

        // Count scheduled training days that have a post
        const daysPosted = activity.filter(d => {
            const isScheduled = trainingDays.includes(d.dayName)
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
