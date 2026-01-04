import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { updateProfileSchema, privacySettingsSchema } from "@/lib/validations"

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()

        // Try profile update first
        let validated = updateProfileSchema.safeParse(body)
        if (!validated.success) {
            // Try privacy settings
            validated = privacySettingsSchema.safeParse(body) as typeof validated
        }

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.errors[0].message },
                { status: 400 }
            )
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: validated.data,
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                bannerUrl: true,
                location: true,
                website: true,
                pronouns: true,
                gymSplit: true,
                trainingDays: true,
                goal: true,
                accountPrivacy: true,
                allowDMs: true,
                showMetrics: true,
                discoverable: true,
            },
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("Update profile error:", error)
        return NextResponse.json(
            { error: "Error al actualizar perfil" },
            { status: 500 }
        )
    }
}

// GET /api/users/me - Get current user
export async function GET() {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                bannerUrl: true,
                location: true,
                website: true,
                pronouns: true,
                gymSplit: true,
                trainingDays: true,
                goal: true,
                accountPrivacy: true,
                allowDMs: true,
                showMetrics: true,
                discoverable: true,
                createdAt: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Get me error:", error)
        return NextResponse.json(
            { error: "Error al obtener usuario" },
            { status: 500 }
        )
    }
}
