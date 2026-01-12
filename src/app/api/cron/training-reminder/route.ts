import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendPushNotification } from "@/lib/push"

// Map day index to English day name (as stored in trainingDays)
const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
]

// Training reminder messages - motivational but not pushy
const TRAINING_MESSAGES = [
    {
        title: "🏋️ Hoy toca entrenar",
        body: "Es tu día programado. La consistencia es todo.",
    },
    {
        title: "💪 Día de gym",
        body: "No hay excusas hoy. Tú lo elegiste.",
    },
    {
        title: "🎯 Tu cuerpo te espera",
        body: "Hoy es uno de tus días de entrenamiento.",
    },
    {
        title: "🔥 Hora de moverse",
        body: "Marcaste este día para entrenar. A cumplir.",
    },
    {
        title: "⚡ Día de entreno",
        body: "Tu plan dice que hoy te toca. ¿Listo?",
    },
]

// Get current date in Santiago, Chile timezone
function getSantiagoDate(): Date {
    const now = new Date()
    // Get the date string in Santiago timezone
    const santiagoString = now.toLocaleString("en-US", { timeZone: "America/Santiago" })
    return new Date(santiagoString)
}

/**
 * GET /api/cron/training-reminder
 * Called daily at morning (configure in vercel.json or cron service)
 * Only sends notifications to users who have TODAY in their trainingDays
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Use Santiago timezone for determining current day
        const santiagoNow = getSantiagoDate()
        const todayDayName = DAY_NAMES[santiagoNow.getDay()]

        console.log(`Training reminder check for: ${todayDayName} (Santiago time: ${santiagoNow.toISOString()})`)

        // Start of day in Santiago timezone
        const startOfDay = new Date(santiagoNow)
        startOfDay.setHours(0, 0, 0, 0)

        const usersToNotify = await (prisma.user as any).findMany({
            where: {
                pushSubscriptions: {
                    some: {}
                },
                trainingDays: {
                    has: todayDayName
                },
                // Optional: only notify if they haven't posted today
                OR: [
                    { lastPostDate: null },
                    { lastPostDate: { lt: startOfDay } }
                ]
            },
            select: {
                id: true,
                username: true,
                displayName: true,
            },
            take: 200 // Limit batch size
        })

        console.log(`Found ${usersToNotify.length} users with training day today`)

        let sentCount = 0
        for (const user of usersToNotify) {
            // Pick random message
            const message = TRAINING_MESSAGES[Math.floor(Math.random() * TRAINING_MESSAGES.length)]

            await sendPushNotification(user.id, {
                title: message.title,
                body: message.body,
                url: "/",
                icon: "/icon.png"
            })

            sentCount++
        }

        return NextResponse.json({
            success: true,
            day: todayDayName,
            notified: sentCount,
            timestamp: now.toISOString()
        })
    } catch (error) {
        console.error("Training reminder error:", error)
        return NextResponse.json(
            { error: "Error sending training reminders" },
            { status: 500 }
        )
    }
}
