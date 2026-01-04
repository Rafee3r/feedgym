import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { registerSchema } from "@/lib/validations"
import { generateUsername } from "@/lib/utils"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validated = registerSchema.safeParse(body)

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.errors[0].message },
                { status: 400 }
            )
        }

        const { email, password, username, displayName } = validated.data

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        })

        if (existingEmail) {
            return NextResponse.json(
                { error: "Este email ya está registrado" },
                { status: 400 }
            )
        }

        // Check if username already exists
        const existingUsername = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
        })

        if (existingUsername) {
            return NextResponse.json(
                { error: "Este nombre de usuario ya está en uso" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                displayName: displayName || username,
                hashedPassword,
            },
        })

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.displayName,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Register error:", error)
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
