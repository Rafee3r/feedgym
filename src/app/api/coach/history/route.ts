import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET - Fetch chat history for the current user
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const messages = await prisma.coachMessage.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 100, // Limit to last 100 messages
            select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
            },
        })

        // Reverse to show in chronological order (oldest -> newest) for the chat UI
        const sortedMessages = messages.reverse()

        return NextResponse.json({ messages: sortedMessages }, {
            headers: {
                "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
            },
        })
    } catch (error) {
        console.error("Error fetching coach history:", error)
        return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 })
    }
}

// POST - Save a message to history
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { role, content } = await request.json()

        if (!role || !content) {
            return NextResponse.json({ error: "role y content requeridos" }, { status: 400 })
        }

        const message = await prisma.coachMessage.create({
            data: {
                userId: session.user.id,
                role,
                content,
            },
        })

        return NextResponse.json({ message })
    } catch (error) {
        console.error("Error saving coach message:", error)
        return NextResponse.json({ error: "Error al guardar mensaje" }, { status: 500 })
    }
}

// DELETE - Clear chat history
export async function DELETE() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        await prisma.coachMessage.deleteMany({
            where: { userId: session.user.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error clearing coach history:", error)
        return NextResponse.json({ error: "Error al limpiar historial" }, { status: 500 })
    }
}
