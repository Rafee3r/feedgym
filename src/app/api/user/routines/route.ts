import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/user/routines — get all routines + trainingDays for the current user
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const [routines, user] = await Promise.all([
        prisma.routine.findMany({
            where: { userId: session.user.id },
            include: {
                exercises: {
                    orderBy: { order: "asc" },
                },
            },
            orderBy: { order: "asc" },
        }),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { trainingDays: true },
        }),
    ])

    return NextResponse.json({
        routines,
        trainingDays: user?.trainingDays ?? [],
    })
}

// POST /api/user/routines — create or update a routine
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, dayOfWeek, exercises } = body as {
        id?: string
        name: string
        dayOfWeek: string
        exercises: { exercise: string; weight?: number; sets: number; reps: number; order: number }[]
    }

    if (!name || !dayOfWeek) {
        return NextResponse.json({ error: "Nombre y día requeridos" }, { status: 400 })
    }

    if (id) {
        // Update existing
        const routine = await prisma.routine.update({
            where: { id, userId: session.user.id },
            data: {
                name,
                dayOfWeek,
                exercises: {
                    deleteMany: {},
                    create: exercises.map((ex, i) => ({
                        exercise: ex.exercise,
                        weight: ex.weight ?? null,
                        sets: ex.sets,
                        reps: ex.reps,
                        order: ex.order ?? i,
                    })),
                },
            },
            include: { exercises: { orderBy: { order: "asc" } } },
        })
        return NextResponse.json(routine)
    } else {
        // Create new
        const routine = await prisma.routine.create({
            data: {
                userId: session.user.id,
                name,
                dayOfWeek,
                exercises: {
                    create: exercises.map((ex, i) => ({
                        exercise: ex.exercise,
                        weight: ex.weight ?? null,
                        sets: ex.sets,
                        reps: ex.reps,
                        order: ex.order ?? i,
                    })),
                },
            },
            include: { exercises: { orderBy: { order: "asc" } } },
        })
        return NextResponse.json(routine)
    }
}

// DELETE /api/user/routines — delete a routine
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

    await prisma.routine.deleteMany({
        where: { id, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
}
