import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// POST /api/admin/create-iron - Create the IRON bot user (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await auth()

        // Only allow authenticated users with specific username (admin)
        if (!session?.user || session.user.username !== "rafael") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if IRON already exists
        const existingIron = await prisma.user.findUnique({
            where: { username: "iron" }
        })

        if (existingIron) {
            return NextResponse.json({
                message: "IRON already exists",
                user: { id: existingIron.id, username: existingIron.username }
            })
        }

        // Create IRON user
        const iron = await prisma.user.create({
            data: {
                email: "iron@feedgym.ai",
                username: "iron",
                displayName: "IRON",
                bio: "Tu coach virtual. Sin excusas. Solo resultados.",
                avatarUrl: null, // Will use default "I" avatar
                onboardingCompleted: true,
                tutorialCompleted: true,
                accountPrivacy: "PUBLIC",
            }
        })

        return NextResponse.json({
            message: "IRON created successfully",
            user: { id: iron.id, username: iron.username }
        })

    } catch (error) {
        console.error("Create IRON error:", error)
        return NextResponse.json({ error: "Failed to create IRON" }, { status: 500 })
    }
}
