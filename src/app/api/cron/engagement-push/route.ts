import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendPushNotification } from "@/lib/push"

// Engagement Messages - Creates curiosity and FOMO
const ENGAGEMENT_MESSAGES = [
    {
        title: "👀 Alguien logró algo increíble...",
        body: "Entra y descubre qué está pasando en el gym.",
    },
    {
        title: "🏆 Nuevos PRs en tu feed",
        body: "¿Cuál es el más impresionante? Tú decides.",
    },
    {
        title: "💬 Tu comunidad te extraña",
        body: "Han pasado unos días. ¿Qué tal va el entreno?",
    },
    {
        title: "🔥 El gym está que arde",
        body: "Mira lo que publicaron mientras no estabas.",
    },
    {
        title: "💪 Motivación extra disponible",
        body: "Otros están progresando. Entra a inspirarte.",
    },
    {
        title: "📈 Hay progreso nuevo",
        body: "Alguien que sigues compartió algo importante.",
    },
    {
        title: "🎯 ¿Ya viste esto?",
        body: "Contenido nuevo que no te puedes perder.",
    },
]

/**
 * GET /api/cron/engagement-push
 * Called every 3 days to re-engage inactive users
 * Uses psychological curiosity and FOMO techniques
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const now = new Date()
        const threeDaysAgo = new Date(now)
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

        // Find users who:
        // 1. Have push subscriptions
        // 2. Last engagement push was more than 3 days ago (or never)
        const usersToNotify = await (prisma.user as any).findMany({
            where: {
                pushSubscriptions: {
                    some: {}
                },
                OR: [
                    { lastEngagementPush: null },
                    { lastEngagementPush: { lt: threeDaysAgo } }
                ]
            },
            select: {
                id: true,
                username: true,
            },
            take: 100 // Limit batch size
        })

        console.log(`Found ${usersToNotify.length} users for engagement push`)

        let sentCount = 0
        for (const user of usersToNotify) {
            // Pick random message
            const message = ENGAGEMENT_MESSAGES[Math.floor(Math.random() * ENGAGEMENT_MESSAGES.length)]

            await sendPushNotification(user.id, {
                title: message.title,
                body: message.body,
                url: "/",
                icon: "/icon.png"
            })

            // Update last engagement push timestamp
            await (prisma.user as any).update({
                where: { id: user.id },
                data: { lastEngagementPush: now }
            })

            sentCount++
        }

        return NextResponse.json({
            success: true,
            notified: sentCount,
            timestamp: now.toISOString()
        })
    } catch (error) {
        console.error("Engagement push error:", error)
        return NextResponse.json(
            { error: "Error sending engagement push" },
            { status: 500 }
        )
    }
}
