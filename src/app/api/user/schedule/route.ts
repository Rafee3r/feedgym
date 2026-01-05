
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const scheduleSchema = z.object({
    days: z.array(z.string()),
})

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const match = scheduleSchema.safeParse(body)

        if (!match.success) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                trainingDays: match.data.days,
            },
            select: {
                trainingDays: true,
            },
        })

        return NextResponse.json(user)

    } catch (error) {
        console.error("Schedule update error:", error)
        return NextResponse.json(
            { error: "Error al actualizar horario" },
            { status: 500 }
        )
    }
}
