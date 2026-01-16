import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE: Remove a food entry
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const entryId = params.id

        // Verify ownership via meal -> dailyLog -> user
        const entry = await prisma.foodEntry.findUnique({
            where: { id: entryId },
            include: {
                meal: {
                    include: {
                        dailyLog: true,
                    },
                },
            },
        })

        if (!entry || entry.meal.dailyLog.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        // Delete the entry
        await prisma.foodEntry.delete({
            where: { id: entryId },
        })

        // Recalculate meal totals
        const remainingEntries = await prisma.foodEntry.findMany({
            where: { mealId: entry.mealId },
        })

        const mealTotals = remainingEntries.reduce(
            (acc, e) => ({
                calories: acc.calories + e.calories,
                protein: acc.protein + e.protein,
                carbs: acc.carbs + e.carbs,
                fats: acc.fats + e.fats,
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        )

        await prisma.meal.update({
            where: { id: entry.mealId },
            data: mealTotals,
        })

        // Recalculate daily log totals
        const allMeals = await prisma.meal.findMany({
            where: { dailyLogId: entry.meal.dailyLogId },
        })

        const dailyTotals = allMeals.reduce(
            (acc, m) => ({
                calories: acc.calories + m.calories,
                protein: acc.protein + m.protein,
                carbs: acc.carbs + m.carbs,
                fats: acc.fats + m.fats,
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        )

        await prisma.dailyLog.update({
            where: { id: entry.meal.dailyLogId },
            data: dailyTotals,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting entry:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
