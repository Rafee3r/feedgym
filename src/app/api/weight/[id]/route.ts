import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateWeightSchema = z.object({
    weight: z.number().min(1, "El peso debe ser mayor a 0"),
    date: z.string().optional(), // ISO date string
    notes: z.string().optional().nullable(),
})

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const validated = updateWeightSchema.safeParse(body)

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.errors[0].message },
                { status: 400 }
            )
        }

        const { weight, date, notes } = validated.data

        // Verify ownership
        const weightLog = await prisma.weightLog.findUnique({
            where: { id },
            select: { userId: true },
        })

        if (!weightLog) {
            return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
        }

        if (weightLog.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const updatedLog = await prisma.weightLog.update({
            where: { id },
            data: {
                weight,
                notes,
                ...(date && { loggedAt: new Date(date) }),
            },
        })

        return NextResponse.json(updatedLog)
    } catch (error) {
        console.error("Update weight error:", error)
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const weightLog = await prisma.weightLog.findUnique({
            where: { id },
            select: { userId: true },
        })

        if (!weightLog) {
            return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
        }

        if (weightLog.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        await prisma.weightLog.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete weight error:", error)
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
    }
}
