import prisma from "@/lib/prisma"

// Title thresholds based on streak
const STREAK_TITLES: { minStreak: number; title: string }[] = [
    { minStreak: 365, title: "Élite Inquebrantable" },
    { minStreak: 180, title: "Leyenda Fitness" },
    { minStreak: 90, title: "Guerrero del Gym" },
    { minStreak: 30, title: "Atleta Constante" },
    { minStreak: 14, title: "Dedicado" },
    { minStreak: 7, title: "Principiante Prometedor" },
    { minStreak: 0, title: "" },
]

// Badge definitions
const STREAK_BADGES: { minStreak: number; badge: string }[] = [
    { minStreak: 365, badge: "🏆 1 Año" },
    { minStreak: 180, badge: "💎 6 Meses" },
    { minStreak: 90, badge: "🔥 90 Días" },
    { minStreak: 30, badge: "⚡ 30 Días" },
    { minStreak: 14, badge: "🌟 2 Semanas" },
    { minStreak: 7, badge: "✨ 1 Semana" },
]

/**
 * Get the title for a given streak
 */
function getTitleForStreak(streak: number): string | null {
    for (const { minStreak, title } of STREAK_TITLES) {
        if (streak >= minStreak) {
            return title
        }
    }
    return null
}

/**
 * Get badges earned for a given streak
 */
function getBadgesForStreak(streak: number): string[] {
    return STREAK_BADGES
        .filter(({ minStreak }) => streak >= minStreak)
        .map(({ badge }) => badge)
}

/**
 * Check if two dates are on the same day (in user's timezone)
 */
function isSameDay(date1: Date, date2: Date, timezone: string = "America/Santiago"): boolean {
    try {
        const d1 = new Date(date1.toLocaleString("en-US", { timeZone: timezone }))
        const d2 = new Date(date2.toLocaleString("en-US", { timeZone: timezone }))
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
    } catch {
        // Fallback to UTC if timezone is invalid
        return date1.toDateString() === date2.toDateString()
    }
}

/**
 * Check if date2 is the day after date1 (in user's timezone)
 */
function isNextDay(date1: Date, date2: Date, timezone: string = "America/Santiago"): boolean {
    try {
        const d1 = new Date(date1.toLocaleString("en-US", { timeZone: timezone }))
        const d2 = new Date(date2.toLocaleString("en-US", { timeZone: timezone }))

        // Add one day to d1
        const nextDay = new Date(d1)
        nextDay.setDate(nextDay.getDate() + 1)

        return nextDay.getFullYear() === d2.getFullYear() &&
            nextDay.getMonth() === d2.getMonth() &&
            nextDay.getDate() === d2.getDate()
    } catch {
        return false
    }
}

/**
 * Update user's streak when they post
 * Should be called after creating a post
 */
export async function updateUserStreak(userId: string): Promise<void> {
    try {
        const user = await (prisma.user as any).findUnique({
            where: { id: userId },
            select: {
                lastPostDate: true,
                currentStreak: true,
                longestStreak: true,
                timezone: true,
                badges: true,
            }
        })

        if (!user) return

        const now = new Date()
        const timezone = user.timezone || "America/Santiago"
        const lastPost = user.lastPostDate

        let newStreak = user.currentStreak || 0

        if (!lastPost) {
            // First post ever
            newStreak = 1
        } else if (isSameDay(lastPost, now, timezone)) {
            // Already posted today, don't increment
            return
        } else if (isNextDay(lastPost, now, timezone)) {
            // Posted yesterday, continue streak
            newStreak = (user.currentStreak || 0) + 1
        } else {
            // Streak broken, start fresh
            newStreak = 1
        }

        // Calculate new longest streak
        const newLongestStreak = Math.max(user.longestStreak || 0, newStreak)

        // Get new title and badges
        const newTitle = getTitleForStreak(newStreak)
        const earnedBadges = getBadgesForStreak(newStreak)

        // Merge with existing badges (no duplicates)
        const existingBadges = user.badges || []
        const allBadges = [...new Set([...existingBadges, ...earnedBadges])]

        // Update user
        await (prisma.user as any).update({
            where: { id: userId },
            data: {
                lastPostDate: now,
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                consistencyTitle: newTitle,
                badges: allBadges,
            }
        })

        console.log(`Updated streak for user ${userId}: ${newStreak} days`)
    } catch (error) {
        console.error("Error updating user streak:", error)
    }
}
