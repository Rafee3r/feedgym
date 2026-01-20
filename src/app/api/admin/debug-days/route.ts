import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

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

        // Get week days
        const weekStart = startOfWeek(santiagoDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(santiagoDate, { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

        const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

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
                // Method 1: Using getDay() directly
                const getdayResult = day.getDay()
                const dayNameFromGetDay = DAY_NAMES[getdayResult]

                // Method 2: Using toLocaleString with weekday
                const santiagoWeekday = day.toLocaleString("en-US", {
                    timeZone: "America/Santiago",
                    weekday: "long"
                })

                // Method 3: Split method we're using
                const santiagoSplit = day.toLocaleString("en-US", {
                    timeZone: "America/Santiago",
                    weekday: "long"
                }).split(",")[0]

                // Expected day name based on index (Mon=0, Tue=1, etc for our Monday-first week)
                const expectedDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                const expectedDayName = expectedDayNames[index]

                return {
                    index,
                    dayISO: day.toISOString(),
                    dayLocalString: day.toString(),
                    getDay: getdayResult,
                    dayNameFromGetDay,
                    santiagoWeekday,
                    santiagoSplit,
                    expectedDayName,
                    match: santiagoSplit === expectedDayName,
                    isScheduled: (user?.trainingDays || []).includes(santiagoSplit),
                    isScheduledExpected: (user?.trainingDays || []).includes(expectedDayName),
                }
            })
        }

        return NextResponse.json(debug, { status: 200 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
