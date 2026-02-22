import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

const INACTIVITY_DAYS = 14
const INACTIVITY_MS = INACTIVITY_DAYS * 24 * 60 * 60 * 1000

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await (prisma.user as any).findUnique({
            where: { id: session.user.id },
            select: {
                lastPostDate: true,
                inactivityLockedAt: true,
                createdAt: true,
                role: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Admins and staff are exempt
        if (user.role === "ADMIN" || user.role === "STAFF") {
            return NextResponse.json({ locked: false })
        }

        // Already locked
        if (user.inactivityLockedAt) {
            return NextResponse.json({ locked: true })
        }

        const now = Date.now()
        const referenceDate = user.lastPostDate
            ? new Date(user.lastPostDate).getTime()
            : new Date(user.createdAt).getTime()

        const daysSinceActivity = Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24))

        if (now - referenceDate >= INACTIVITY_MS) {
            // Lock the user
            await (prisma.user as any).update({
                where: { id: session.user.id },
                data: { inactivityLockedAt: new Date() }
            })

            return NextResponse.json({ locked: true })
        }

        return NextResponse.json({
            locked: false,
            daysSinceLastPost: daysSinceActivity,
            daysUntilLock: INACTIVITY_DAYS - daysSinceActivity,
        })
    } catch (error) {
        console.error("[Inactivity Check] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
