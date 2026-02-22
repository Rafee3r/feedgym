import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

const UNBAN_CODE = "RAFESYUNBAN"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { code } = body

        if (!code || typeof code !== "string") {
            return NextResponse.json(
                { success: false, error: "Código requerido" },
                { status: 400 }
            )
        }

        if (code.trim().toUpperCase() !== UNBAN_CODE) {
            return NextResponse.json(
                { success: false, error: "Código incorrecto. Intenta de nuevo." },
                { status: 400 }
            )
        }

        // Unlock the user: clear lock and reset the inactivity timer
        await (prisma.user as any).update({
            where: { id: session.user.id },
            data: {
                inactivityLockedAt: null,
                lastPostDate: new Date(), // Reset the 14-day timer
            }
        })

        console.log(`[Unban] User ${session.user.id} unlocked with code`)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[Unban] Error:", error)
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
