import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfWeek, endOfWeek, eachDayOfInterval, addHours } from "date-fns"

// Day names in Monday-first order (matches weekStartsOn: 1)
const WEEKDAY_NAMES_MONDAY_FIRST = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

// DEBUG endpoint to see what's happening with training days
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || session.user.username !== "rafael") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const santiagoNow = new Date()
        const santiagoString = santiagoNow.toLocaleString("en-US", { timeZone: "America/Santiago" })
        const santiagoDate = new Date(santiagoString)

        // Get week days at NOON (not midnight) to avoid timezone edge cases
        const weekStart = startOfWeek(santiagoDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(santiagoDate, { weekStartsOn: 1 })
        const rawDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
        const days = rawDays.map(d => addHours(d, 12)) // Move to noon!

        // Get user's training days
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { trainingDays: true }
        })

        const debug = {
            currentTime: {
                utc: new Date().toISOString(),
                santiagoString,
                santiagoDate: santiagoDate.toISOString(),
            },
            weekRange: {
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
            },
            savedTrainingDays: user?.trainingDays || [],
            weekDaysAnalysis: days.map((day, index) => {
                // Use INDEX to get day name (this is the FIX!)
                const dayNameByIndex = WEEKDAY_NAMES_MONDAY_FIRST[index]

                // Old method for comparison
                const santiagoWeekday = day.toLocaleString("en-US", {
                    timeZone: "America/Santiago",
                    weekday: "long"
                })

                const isScheduled = (user?.trainingDays || []).includes(dayNameByIndex)

                return {
                    index,
                    dayISO: day.toISOString(),
                    dayNameByIndex, // This is what we use now
                    santiagoWeekday, // This is what toLocaleString returns (should match now with noon)
                    match: dayNameByIndex === santiagoWeekday,
                    isScheduled,
                }
            })
        }

        return NextResponse.json(debug, { status: 200 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
