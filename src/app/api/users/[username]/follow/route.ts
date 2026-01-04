import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// POST /api/users/[username]/follow - Toggle follow
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const targetUser = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            select: { id: true },
        })

        if (!targetUser) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            )
        }

        if (targetUser.id === session.user.id) {
            return NextResponse.json(
                { error: "No puedes seguirte a ti mismo" },
                { status: 400 }
            )
        }

        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: session.user.id,
                    followingId: targetUser.id,
                },
            },
        })

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: { id: existingFollow.id },
            })

            return NextResponse.json({ following: false })
        } else {
            // Follow
            await prisma.follow.create({
                data: {
                    followerId: session.user.id,
                    followingId: targetUser.id,
                },
            })

            // Create notification
            await prisma.notification.create({
                data: {
                    type: "FOLLOW",
                    recipientId: targetUser.id,
                    actorId: session.user.id,
                },
            })

            return NextResponse.json({ following: true })
        }
    } catch (error) {
        console.error("Follow error:", error)
        return NextResponse.json(
            { error: "Error al seguir/dejar de seguir" },
            { status: 500 }
        )
    }
}
