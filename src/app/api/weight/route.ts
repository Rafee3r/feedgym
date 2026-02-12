import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { weightLogSchema } from "@/lib/validations"

// GET /api/weight - Get weight logs for current or specified user
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "30")
        const userIdParam = searchParams.get("userId")
        const targetUserId = userIdParam || session.user.id

        const logs = await prisma.weightLog.findMany({
            where: { userId: targetUserId },
            orderBy: { loggedAt: "desc" },
            take: limit,
        })

        // Get user's goal and targetWeight for display
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { goal: true, targetWeight: true }
        })

        // Format for chart (reverse for chronological order)
        const chartData = logs
            .reverse()
            .map((log) => ({
                date: log.loggedAt.toISOString().split("T")[0],
                weight: log.weight,
            }))

        const latestWeight = logs.length > 0 ? logs[logs.length - 1].weight : null
        const previousWeight = logs.length > 1 ? logs[logs.length - 2].weight : null
        const weightChange =
            latestWeight && previousWeight ? latestWeight - previousWeight : null

        return NextResponse.json({
            logs: logs.reverse().map((log) => ({
                id: log.id,
                weight: log.weight,
                unit: log.unit,
                notes: log.notes,
                loggedAt: log.loggedAt,
            })),
            chartData,
            stats: {
                latest: latestWeight,
                change: weightChange,
                count: logs.length,
            },
            goal: targetUser?.goal || "MAINTAIN",
            targetWeight: targetUser?.targetWeight || null,
        }, {
            headers: {
                "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
            },
        })
    } catch (error) {
        console.error("Get weight logs error:", error)
        return NextResponse.json(
            { error: "Error al obtener registros de peso" },
            { status: 500 }
        )
    }
}

// POST /api/weight - Add weight log
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const validated = weightLogSchema.safeParse(body)

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.errors[0].message },
                { status: 400 }
            )
        }

        const { weight, unit, notes, loggedAt } = validated.data

        const log = await prisma.weightLog.create({
            data: {
                userId: session.user.id,
                weight,
                unit,
                notes,
                loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
            },
        })

        return NextResponse.json(
            {
                id: log.id,
                weight: log.weight,
                unit: log.unit,
                notes: log.notes,
                loggedAt: log.loggedAt,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Create weight log error:", error)
        return NextResponse.json(
            { error: "Error al registrar peso" },
            { status: 500 }
        )
    }
}

// PATCH /api/weight - Update target weight
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const { targetWeight } = body

        if (targetWeight !== null && (typeof targetWeight !== "number" || targetWeight <= 0 || targetWeight > 500)) {
            return NextResponse.json(
                { error: "Peso meta inválido" },
                { status: 400 }
            )
        }

        await (prisma.user as any).update({
            where: { id: session.user.id },
            data: { targetWeight },
        })

        return NextResponse.json({ success: true, targetWeight })
    } catch (error) {
        console.error("Update target weight error:", error)
        return NextResponse.json(
            { error: "Error al actualizar peso meta" },
            { status: 500 }
        )
    }
}
