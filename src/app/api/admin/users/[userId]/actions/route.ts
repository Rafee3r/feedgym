import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import prisma from "@/lib/prisma"

const actionSchema = z.object({
    action: z.enum(["ban", "unban", "shadowban", "unshadowban", "freeze", "unfreeze", "mute", "unmute"]),
    duration: z.number().optional(), // in minutes, for mute
})

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth()
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { userId } = await params
        const body = await request.json()
        const validated = actionSchema.safeParse(body)

        if (!validated.success) {
            return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
        }

        const { action, duration } = validated.data

        const updateData: any = {}

        switch (action) {
            case "ban":
                updateData.isBanned = true
                break
            case "unban":
                updateData.isBanned = false
                break
            case "shadowban":
                updateData.isShadowbanned = true
                break
            case "unshadowban":
                updateData.isShadowbanned = false
                break
            case "freeze":
                updateData.isFrozen = true
                break
            case "unfreeze":
                updateData.isFrozen = false
                break
            case "mute":
                if (!duration) return NextResponse.json({ error: "Duración requerida para mute" }, { status: 400 })
                updateData.mutedUntil = new Date(Date.now() + duration * 60 * 1000)
                break
            case "unmute":
                updateData.mutedUntil = null
                break
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, username: true, isBanned: true, isShadowbanned: true, isFrozen: true, mutedUntil: true }
        })

        return NextResponse.json(user)

    } catch (error) {
        console.error("Admin action error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
