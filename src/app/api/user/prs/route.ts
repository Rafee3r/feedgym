import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/user/prs - Get current user's personal records (best per exercise)
export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const allPRs = await prisma.personalRecord.findMany({
            where: { userId: session.user.id },
            orderBy: { weight: "desc" },
        })

        // Group by exercise, keep only the best (heaviest) per exercise
        const bestByExercise = new Map<string, typeof allPRs[0]>()
        for (const pr of allPRs) {
            const key = pr.exercise.toLowerCase().trim()
            const existing = bestByExercise.get(key)
            if (!existing || pr.weight > existing.weight) {
                bestByExercise.set(key, pr)
            }
        }

        const prs = Array.from(bestByExercise.values())
            .sort((a, b) => b.weight - a.weight)
            .map(pr => ({
                id: pr.id,
                exercise: pr.exercise,
                weight: pr.weight,
                unit: pr.unit,
                reps: pr.reps,
                notes: pr.notes,
                achievedAt: pr.achievedAt,
            }))

        return NextResponse.json({ prs })
    } catch (error) {
        console.error("Get PRs error:", error)
        return NextResponse.json({ error: "Error al obtener PRs" }, { status: 500 })
    }
}

// POST /api/user/prs - Add or update a personal record
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const { exercise, weight, unit, reps, notes } = body

        if (!exercise || typeof exercise !== "string" || exercise.trim().length === 0) {
            return NextResponse.json({ error: "Ejercicio requerido" }, { status: 400 })
        }
        if (!weight || typeof weight !== "number" || weight <= 0) {
            return NextResponse.json({ error: "Peso inválido" }, { status: 400 })
        }

        const pr = await prisma.personalRecord.create({
            data: {
                userId: session.user.id,
                exercise: exercise.trim(),
                weight,
                unit: unit || "KG",
                reps: reps || 1,
                notes: notes || null,
                achievedAt: new Date(),
            },
        })

        return NextResponse.json({
            id: pr.id,
            exercise: pr.exercise,
            weight: pr.weight,
            unit: pr.unit,
            reps: pr.reps,
            notes: pr.notes,
            achievedAt: pr.achievedAt,
        }, { status: 201 })
    } catch (error) {
        console.error("Create PR error:", error)
        return NextResponse.json({ error: "Error al crear PR" }, { status: 500 })
    }
}
