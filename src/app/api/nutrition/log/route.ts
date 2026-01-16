import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MealType } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date");

        if (!dateParam) {
            return new NextResponse("Missing date parameter", { status: 400 });
        }

        const logDate = new Date(dateParam);
        logDate.setHours(0, 0, 0, 0);

        const dailyLog = await prisma.dailyLog.findUnique({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: logDate,
                },
            },
            include: {
                meals: {
                    include: {
                        items: true
                    },
                    orderBy: {
                        createdAt: 'asc' // or strict order if we add 'order' field
                    }
                }
            }
        });

        return NextResponse.json(dailyLog || null);

    } catch (error) {
        console.error("Error fetching nutrition log:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { date, mealType, foodItem } = body;

        if (!date || !mealType || !foodItem) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);

        // 1. Find or create DailyLog for this user and date
        let dailyLog = await prisma.dailyLog.findUnique({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date: logDate,
                },
            },
        });

        if (!dailyLog) {
            dailyLog = await prisma.dailyLog.create({
                data: {
                    userId: session.user.id,
                    date: logDate,
                },
            });
        }

        // 2. Find or create Meal for this DailyLog and MealType
        // We can't use findUnique unless we add a composite unique constraint to Meal
        // For now, we findFirst
        let meal = await prisma.meal.findFirst({
            where: {
                dailyLogId: dailyLog.id,
                type: mealType as MealType,
            },
        });

        if (!meal) {
            meal = await prisma.meal.create({
                data: {
                    dailyLogId: dailyLog.id,
                    type: mealType as MealType,
                },
            });
        }

        // 3. Create FoodEntry
        const entry = await prisma.foodEntry.create({
            data: {
                mealId: meal.id,
                name: foodItem.name,
                calories: foodItem.calories,
                protein: foodItem.protein,
                carbs: foodItem.carbs,
                fats: foodItem.fats,
                portion: 1, // Defaulting to 1 serving for now layout
                unit: foodItem.unit,
            },
        });

        // 4. Update Meal totals
        const mealEntries = await prisma.foodEntry.findMany({
            where: { mealId: meal.id },
        });

        const mealTotals = mealEntries.reduce(
            (acc, curr) => ({
                calories: acc.calories + curr.calories,
                protein: acc.protein + curr.protein,
                carbs: acc.carbs + curr.carbs,
                fats: acc.fats + curr.fats,
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        await prisma.meal.update({
            where: { id: meal.id },
            data: mealTotals,
        });

        // 5. Update DailyLog totals (re-fetch all meals)
        const allMeals = await prisma.meal.findMany({
            where: { dailyLogId: dailyLog.id },
        });

        const dailyTotals = allMeals.reduce(
            (acc, curr) => ({
                calories: acc.calories + curr.calories,
                protein: acc.protein + curr.protein,
                carbs: acc.carbs + curr.carbs,
                fats: acc.fats + curr.fats,
            }),
            { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        const updatedDailyLog = await prisma.dailyLog.update({
            where: { id: dailyLog.id },
            data: dailyTotals,
        });

        return NextResponse.json({
            success: true,
            entry,
            dailyLog: updatedDailyLog,
        });

    } catch (error) {
        console.error("Error logging food:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
