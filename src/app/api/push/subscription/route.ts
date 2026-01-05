import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// In a real app, these should be in .env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BK7pzjnM-Z-Amec4MB7DXclrbBq8Zf4iUxivV7n2OUfRpPVNqf1MXUrY4o-0t4k22y0eLZTmBM0gpEreBIcq-K0"
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "4Ej4xJKDz7jb6irsKpLSpb8rP0NG1aeQUsPiVJTcsEs"

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const subscription = await request.json()

        // Check if subscription already exists
        const existing = await prisma.pushSubscription.findUnique({
            where: { endpoint: subscription.endpoint }
        })

        if (!existing) {
            await prisma.pushSubscription.create({
                data: {
                    endpoint: subscription.endpoint,
                    keys: subscription.keys,
                    userId: session.user.id
                }
            })
        }

        return NextResponse.json({ success: true }, { status: 201 })
    } catch (error) {
        console.error("Error saving subscription:", error)
        return NextResponse.json({ error: "Error saving subscription" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { endpoint } = await request.json()

        await prisma.pushSubscription.delete({
            where: { endpoint }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting subscription:", error)
        return NextResponse.json({ error: "Error deleting subscription" }, { status: 500 })
    }
}
