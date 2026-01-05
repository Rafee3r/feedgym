import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
})

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const validated = updatePasswordSchema.safeParse(body)

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.errors[0].message },
                { status: 400 }
            )
        }

        const { currentPassword, newPassword } = validated.data

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, hashedPassword: true },
        })

        if (!user || !user.hashedPassword) {
            return NextResponse.json(
                { error: "Usuario no encontrado o sin contraseña configurada" },
                { status: 404 }
            )
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.hashedPassword)

        if (!isValid) {
            return NextResponse.json(
                { error: "La contraseña actual es incorrecta" },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { hashedPassword },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Update password error:", error)
        return NextResponse.json(
            { error: "Error al actualizar contraseña" },
            { status: 500 }
        )
    }
}
