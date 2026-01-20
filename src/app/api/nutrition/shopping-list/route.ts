import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET - Fetch shopping list
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        let list = await prisma.shoppingList.findUnique({
            where: { userId: session.user.id },
            include: { items: { orderBy: { createdAt: 'desc' } } }
        })

        if (!list) {
            list = await prisma.shoppingList.create({
                data: { userId: session.user.id },
                include: { items: true }
            })
        }

        return NextResponse.json({ items: list.items })
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch list" }, { status: 500 })
    }
}

// POST - Add item
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { name, quantity, category } = await req.json()

        const list = await prisma.shoppingList.findUnique({
            where: { userId: session.user.id }
        })

        if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 })

        const newItem = await prisma.shoppingItem.create({
            data: {
                shoppingListId: list.id,
                name,
                quantity: quantity || "1 un.",
                category: category || "Otros"
            }
        })

        return NextResponse.json(newItem)
    } catch (error) {
        return NextResponse.json({ error: "Failed to add item" }, { status: 500 })
    }
}

// PATCH - Toggle item check status
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id, checked } = await req.json()

        const updated = await prisma.shoppingItem.update({
            where: { id },
            data: { checked }
        })

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
    }
}
