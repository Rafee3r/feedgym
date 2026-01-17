import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Get user's daily logs for the past 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        thirtyDaysAgo.setHours(0, 0, 0, 0)

        const logs = await prisma.dailyLog.findMany({
            where: {
                userId: session.user.id,
                date: { gte: thirtyDaysAgo },
                calories: { gt: 0 } // Only count days where user logged something
            },
            select: { date: true, calories: true },
            orderBy: { date: 'desc' }
        })

        if (logs.length === 0) {
            return NextResponse.json({ streak: 0 })
        }

        // Calculate streak - consecutive days with logged food
        let streak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Convert logs to date strings for easy comparison
        const logDates = new Set(
            logs.map(log => {
                const d = new Date(log.date)
                d.setHours(0, 0, 0, 0)
                return d.toISOString().split('T')[0]
            })
        )

        // Check if today has logs
        const todayStr = today.toISOString().split('T')[0]
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        // Start counting from today or yesterday
        let checkDate = new Date(today)

        // If no log today, check if yesterday has one to continue streak
        if (!logDates.has(todayStr)) {
            if (!logDates.has(yesterdayStr)) {
                // No log today or yesterday - streak is broken
                return NextResponse.json({ streak: 0 })
            }
            // Yesterday has log, start counting from yesterday
            checkDate = yesterday
        }

        // Count consecutive days backwards
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0]
            if (logDates.has(dateStr)) {
                streak++
                checkDate.setDate(checkDate.getDate() - 1)
            } else {
                break
            }

            // Safety limit
            if (streak > 365) break
        }

        return NextResponse.json({ streak })

    } catch (error) {
        console.error("Streak API Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
