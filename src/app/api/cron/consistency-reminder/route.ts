import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendPushNotification } from "@/lib/push"

// Loss Aversion Messages - Creates urgency
const CONSISTENCY_MESSAGES = [
    {
        title: "⏰ Tu racha está en peligro",
        body: "¡Aún puedes publicar hoy! No pierdas lo que has logrado.",
    },
    {
        title: "🔥 ¡No rompas la racha!",
        body: "Tu progreso de {streak} días se perderá si no publicas hoy.",
    },
    {
        title: "💪 Te queda poco tiempo",
        body: "Publica tu progreso antes de medianoche y mantén tu constancia.",
    },
    {
        title: "🏋️ El gym te espera",
        body: "Comparte tu entreno de hoy. Tu yo del futuro te lo agradecerá.",
    },
    {
        title: "📸 ¿Entrenaste hoy?",
        body: "Cuéntale a tu comunidad. Son solo 2 minutos.",
    },
]

// Engagement Messages - Creates curiosity (FOMO)
const ENGAGEMENT_MESSAGES = [
    {
        title: "👀 Alguien logró algo increíble...",
        body: "Entra y descubre qué está pasando en el gym.",
    },
    {
        title: "🏆 3 nuevos PRs en tu feed",
        body: "¿Cuál es el más impresionante? Tú decides.",
    },
    {
        title: "💬 Hay actividad nueva",
        body: "Tu comunidad estuvo activa. ¿Te lo vas a perder?",
    },
    {
        title: "🔥 El gym está que arde hoy",
        body: "Mira lo que publicaron mientras no estabas.",
    },
    {
        title: "💪 Motivación extra disponible",
        body: "Otros están progresando. ¿Y tú qué tal?",
    },
]

/**
 * GET /api/cron/consistency-reminder
 * Called daily around 8-9pm to remind users who haven't posted
 * This should be triggered by a cron service (Vercel Cron, etc.)
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        // Find users who:
        // 1. Have push subscriptions
        // 2. Haven't posted today
        // 3. Have training days that include today (optional filter)
        const usersWithPush = await (prisma.user as any).findMany({
            where: {
                pushSubscriptions: {
                    some: {}
                },
                // Only users who should train today could be filtered here
                // For now, notify everyone
            },
            select: {
                id: true,
                username: true,
                trainingDays: true,
                currentStreak: true,
                posts: {
                    where: {
                        createdAt: {
                            gte: todayStart
                        }
                    },
                    take: 1,
                    select: { id: true }
                }
            }
        })

        // Filter to only users who haven't posted today
        const usersToNotify = usersWithPush.filter((user: any) => user.posts.length === 0)

        console.log(`Found ${usersToNotify.length} users to send consistency reminders`)

        // Send notifications
        let sentCount = 0
        for (const user of usersToNotify) {
            // Pick random message
            const messageTemplate = CONSISTENCY_MESSAGES[Math.floor(Math.random() * CONSISTENCY_MESSAGES.length)]
            const message = {
                title: messageTemplate.title,
                body: messageTemplate.body.replace("{streak}", String(user.currentStreak || 0)),
            }

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
            notified: sentCount,
            total: usersWithPush.length,
            timestamp: now.toISOString()
        })
    } catch (error) {
        console.error("Consistency reminder error:", error)
        return NextResponse.json(
            { error: "Error sending reminders" },
            { status: 500 }
        )
    }
}
