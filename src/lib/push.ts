import webpush from "web-push"
import prisma from "@/lib/prisma"

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BK7pzjnM-Z-Amec4MB7DXclrbBq8Zf4iUxivV7n2OUfRpPVNqf1MXUrY4o-0t4k22y0eLZTmBM0gpEreBIcq-K0"
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "4Ej4xJKDz7jb6irsKpLSpb8rP0NG1aeQUsPiVJTcsEs"
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@feedgym.com"

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

interface PushPayload {
    title: string
    body: string
    url?: string
    icon?: string
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
    try {
        // Get all subscriptions for this user
        const subscriptions = await (prisma as any).pushSubscription.findMany({
            where: { userId }
        })

        if (subscriptions.length === 0) {
            console.log(`No push subscriptions for user ${userId}`)
            return
        }

        const pushPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || "/",
            icon: payload.icon || "/icon.png"
        })

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map((sub: any) =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: sub.keys as { p256dh: string; auth: string }
                    },
                    pushPayload
                )
            )
        )

        // Clean up expired subscriptions
        for (let i = 0; i < results.length; i++) {
            const result = results[i]
            if (result.status === "rejected") {
                const error = result.reason as any
                if (error.statusCode === 404 || error.statusCode === 410) {
                    // Subscription expired, remove it
                    await (prisma as any).pushSubscription.delete({
                        where: { id: subscriptions[i].id }
                    })
                    console.log(`Removed expired subscription for user ${userId}`)
                }
            }
        }

        console.log(`Sent push to ${subscriptions.length} devices for user ${userId}`)
    } catch (error) {
        console.error("Error sending push notification:", error)
    }
}

/**
 * Parse mentions from post content
 * Returns array of usernames mentioned (without @)
 */
export function parseMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
        const username = match[1].toLowerCase()
        if (!mentions.includes(username)) {
            mentions.push(username)
        }
    }

    return mentions
}
