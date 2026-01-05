import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/auth/check-ban - Check if current user is banned
export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ isBanned: false })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isBanned: true }
        }) as any // Cast for stale Prisma client

        return NextResponse.json({
            isBanned: user?.isBanned ?? false
        })
    } catch (error) {
        console.error("Check ban error:", error)
        return NextResponse.json({ isBanned: false })
    }
}
