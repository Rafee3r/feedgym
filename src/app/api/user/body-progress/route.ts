import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

function getISOWeek(d: Date): number {
    const date = new Date(d.getTime())
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
    const week1 = new Date(date.getFullYear(), 0, 4)
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

// GET /api/user/body-progress — list all progress photos
export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    const photos = await prisma.bodyProgress.findMany({
        where: { userId: session.user.id },
        orderBy: [{ year: "desc" }, { week: "desc" }, { createdAt: "desc" }],
        take: limit,
    })

    // Check if user has already submitted this week
    const now = new Date()
    const currentWeek = getISOWeek(now)
    const currentYear = now.getFullYear()
    
    const thisWeekPhotos = photos.filter(
        (p) => p.week === currentWeek && p.year === currentYear
    )

    return NextResponse.json({
        photos,
        currentWeek,
        currentYear,
        hasPhotoThisWeek: thisWeekPhotos.length > 0,
        thisWeekPhotos,
    })
}

// POST /api/user/body-progress — upload a progress photo
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { imageUrl, category, weight, notes } = body as {
        imageUrl: string
        category?: "FRONT" | "SIDE" | "BACK"
        weight?: number
        notes?: string
    }

    if (!imageUrl) {
        return NextResponse.json({ error: "Imagen requerida" }, { status: 400 })
    }

    const now = new Date()
    const week = getISOWeek(now)
    const year = now.getFullYear()

    const photo = await prisma.bodyProgress.create({
        data: {
            userId: session.user.id,
            imageUrl,
            category: category || "FRONT",
            week,
            year,
            weight: weight ?? null,
            notes: notes ?? null,
        },
    })

    return NextResponse.json(photo)
}

// DELETE /api/user/body-progress — delete a photo
export async function DELETE(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
        return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    await prisma.bodyProgress.deleteMany({
        where: { id, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
}
