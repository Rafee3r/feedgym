import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Comprehensive Chilean meal database organized by category and goal
const MEAL_DATABASE = {
    desayuno: [
        // BALANCED
        { id: "d1", name: "Huevos revueltos con pan", calories: 380, protein: 22, carbs: 35, fats: 18, tags: ["balanced", "rápido"], prepTime: 10 },
        { id: "d2", name: "Tostadas con palta y huevo", calories: 420, protein: 18, carbs: 38, fats: 22, tags: ["balanced", "proteína"], prepTime: 8 },
        { id: "d3", name: "Pan con queso y jamón", calories: 350, protein: 16, carbs: 40, fats: 14, tags: ["balanced", "clásico"], prepTime: 5 },
        { id: "d4", name: "Yogurt con granola y fruta", calories: 320, protein: 12, carbs: 48, fats: 10, tags: ["balanced", "fibra"], prepTime: 3 },
        // BULK (calorie-dense)
        { id: "d5", name: "Avena con plátano, miel y mantequilla de maní", calories: 550, protein: 18, carbs: 72, fats: 22, tags: ["bulk", "energía"], prepTime: 8 },
        { id: "d6", name: "Panqueques con huevo y tocino", calories: 620, protein: 28, carbs: 55, fats: 32, tags: ["bulk", "proteína"], prepTime: 15 },
        { id: "d7", name: "Sandwich de huevo con queso y palta", calories: 580, protein: 26, carbs: 42, fats: 35, tags: ["bulk", "completo"], prepTime: 10 },
        { id: "d8", name: "Batido de proteína con avena y plátano", calories: 480, protein: 35, carbs: 58, fats: 12, tags: ["bulk", "post-gym"], prepTime: 5 },
        // CUT (high volume, low cal)
        { id: "d9", name: "Claras de huevo con espinaca", calories: 150, protein: 24, carbs: 4, fats: 3, tags: ["cut", "proteína"], prepTime: 8 },
        { id: "d10", name: "Yogurt griego con berries", calories: 180, protein: 18, carbs: 20, fats: 2, tags: ["cut", "liviano"], prepTime: 2 },
        { id: "d11", name: "Omelette de verduras (sin yema extra)", calories: 200, protein: 20, carbs: 8, fats: 10, tags: ["cut", "saciante"], prepTime: 10 },
        { id: "d12", name: "Tostada integral con cottage y tomate", calories: 220, protein: 16, carbs: 28, fats: 5, tags: ["cut", "fibra"], prepTime: 5 },
    ],
    almuerzo: [
        // BALANCED
        { id: "a1", name: "Pollo grillado con arroz y ensalada", calories: 520, protein: 42, carbs: 55, fats: 12, tags: ["balanced", "clásico"], prepTime: 25 },
        { id: "a2", name: "Pescado al horno con puré", calories: 480, protein: 38, carbs: 45, fats: 14, tags: ["balanced", "omega3"], prepTime: 30 },
        { id: "a3", name: "Cazuela de pollo", calories: 420, protein: 32, carbs: 48, fats: 10, tags: ["balanced", "casero"], prepTime: 40 },
        { id: "a4", name: "Tallarines con salsa bolognesa", calories: 550, protein: 28, carbs: 65, fats: 18, tags: ["balanced", "pasta"], prepTime: 25 },
        // BULK
        { id: "a5", name: "Porotos con riendas", calories: 680, protein: 32, carbs: 85, fats: 22, tags: ["bulk", "chileno"], prepTime: 45 },
        { id: "a6", name: "Churrasco italiano con papas fritas", calories: 850, protein: 45, carbs: 72, fats: 42, tags: ["bulk", "potente"], prepTime: 20 },
        { id: "a7", name: "Pastel de choclo", calories: 720, protein: 35, carbs: 68, fats: 32, tags: ["bulk", "tradicional"], prepTime: 60 },
        { id: "a8", name: "Arroz con carne molida y huevo frito", calories: 750, protein: 38, carbs: 78, fats: 30, tags: ["bulk", "completo"], prepTime: 20 },
        // CUT
        { id: "a9", name: "Ensalada de pollo grillado", calories: 320, protein: 38, carbs: 15, fats: 12, tags: ["cut", "proteína"], prepTime: 15 },
        { id: "a10", name: "Ceviche de pescado", calories: 250, protein: 32, carbs: 12, fats: 8, tags: ["cut", "fresco"], prepTime: 20 },
        { id: "a11", name: "Pollo a la plancha con verduras salteadas", calories: 350, protein: 40, carbs: 18, fats: 14, tags: ["cut", "limpio"], prepTime: 20 },
        { id: "a12", name: "Sopa de verduras con pollo desmenuzado", calories: 280, protein: 28, carbs: 25, fats: 8, tags: ["cut", "saciante"], prepTime: 30 },
    ],
    cena: [
        // BALANCED
        { id: "c1", name: "Salmón con ensalada verde", calories: 450, protein: 38, carbs: 12, fats: 28, tags: ["balanced", "omega3"], prepTime: 20 },
        { id: "c2", name: "Pollo al horno con papas doradas", calories: 520, protein: 42, carbs: 45, fats: 18, tags: ["balanced", "casero"], prepTime: 40 },
        { id: "c3", name: "Cazuela de vacuno", calories: 480, protein: 35, carbs: 52, fats: 14, tags: ["balanced", "chileno"], prepTime: 50 },
        { id: "c4", name: "Carbonada", calories: 420, protein: 28, carbs: 48, fats: 12, tags: ["balanced", "sopa"], prepTime: 45 },
        // BULK
        { id: "c5", name: "Bistec a lo pobre", calories: 920, protein: 52, carbs: 68, fats: 48, tags: ["bulk", "potente"], prepTime: 25 },
        { id: "c6", name: "Lasaña de carne", calories: 780, protein: 42, carbs: 62, fats: 38, tags: ["bulk", "pasta"], prepTime: 50 },
        { id: "c7", name: "Completo italiano", calories: 580, protein: 22, carbs: 55, fats: 32, tags: ["bulk", "rápido"], prepTime: 10 },
        { id: "c8", name: "Empanadas de pino (2 unidades)", calories: 720, protein: 28, carbs: 65, fats: 38, tags: ["bulk", "chileno"], prepTime: 15 },
        // CUT
        { id: "c9", name: "Merluza al vapor con brócoli", calories: 280, protein: 35, carbs: 12, fats: 10, tags: ["cut", "liviano"], prepTime: 20 },
        { id: "c10", name: "Wrap de lechuga con pollo", calories: 250, protein: 32, carbs: 8, fats: 12, tags: ["cut", "keto"], prepTime: 15 },
        { id: "c11", name: "Tortilla de claras con champiñones", calories: 200, protein: 26, carbs: 6, fats: 8, tags: ["cut", "proteína"], prepTime: 12 },
        { id: "c12", name: "Ensalada tibia de atún", calories: 320, protein: 35, carbs: 15, fats: 14, tags: ["cut", "omega3"], prepTime: 15 },
    ],
    snack: [
        // BALANCED
        { id: "s1", name: "Fruta con yogurt", calories: 180, protein: 8, carbs: 32, fats: 3, tags: ["balanced", "rápido"], prepTime: 2 },
        { id: "s2", name: "Pan con palta", calories: 250, protein: 6, carbs: 28, fats: 14, tags: ["balanced", "saciante"], prepTime: 3 },
        { id: "s3", name: "Mix de frutos secos (30g)", calories: 180, protein: 5, carbs: 8, fats: 16, tags: ["balanced", "energía"], prepTime: 1 },
        { id: "s4", name: "Galletas de arroz con queso crema", calories: 150, protein: 4, carbs: 22, fats: 5, tags: ["balanced", "liviano"], prepTime: 2 },
        // BULK
        { id: "s5", name: "Batido de proteína con plátano y avena", calories: 420, protein: 32, carbs: 52, fats: 10, tags: ["bulk", "post-gym"], prepTime: 5 },
        { id: "s6", name: "Tostadas con mantequilla de maní y miel", calories: 380, protein: 12, carbs: 45, fats: 18, tags: ["bulk", "energía"], prepTime: 3 },
        { id: "s7", name: "Granola con leche entera", calories: 350, protein: 10, carbs: 55, fats: 12, tags: ["bulk", "carbos"], prepTime: 2 },
        { id: "s8", name: "Sandwich de atún", calories: 380, protein: 22, carbs: 35, fats: 16, tags: ["bulk", "proteína"], prepTime: 5 },
        // CUT
        { id: "s9", name: "Manzana con canela", calories: 95, protein: 0, carbs: 25, fats: 0, tags: ["cut", "dulce"], prepTime: 2 },
        { id: "s10", name: "Pepino con limón y sal", calories: 30, protein: 1, carbs: 6, fats: 0, tags: ["cut", "crujiente"], prepTime: 2 },
        { id: "s11", name: "Yogurt griego solo", calories: 100, protein: 17, carbs: 6, fats: 0, tags: ["cut", "proteína"], prepTime: 1 },
        { id: "s12", name: "Huevo duro", calories: 78, protein: 6, carbs: 1, fats: 5, tags: ["cut", "proteína"], prepTime: 10 },
        { id: "s13", name: "Apio con hummus", calories: 120, protein: 4, carbs: 12, fats: 6, tags: ["cut", "fibra"], prepTime: 3 },
        { id: "s14", name: "Gelatina sin azúcar", calories: 20, protein: 2, carbs: 2, fats: 0, tags: ["cut", "dulce"], prepTime: 1 },
    ],
}

// GET: Fetch meals by category and/or goal
export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category") as keyof typeof MEAL_DATABASE | null
        const forGoal = searchParams.get("forGoal") // CUT, BULK, MAINTAIN

        // Get user's goal if not specified
        let userGoal = forGoal
        if (!userGoal) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { goal: true },
            })
            userGoal = user?.goal || "MAINTAIN"
        }

        // Map fitness goal to meal tags
        const goalTagMap: Record<string, string> = {
            CUT: "cut",
            BULK: "bulk",
            MAINTAIN: "balanced",
            RECOMP: "balanced",
        }
        const preferredTag = goalTagMap[userGoal] || "balanced"

        // Get yesterday's meals for "repeat" suggestions
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)

        const yesterdayLog = await prisma.dailyLog.findFirst({
            where: {
                userId: session.user.id,
                date: { gte: yesterday, lte: yesterdayEnd },
            },
            include: {
                meals: {
                    include: { items: true },
                },
            },
        })

        const yesterdayMeals = yesterdayLog?.meals?.flatMap((m) =>
            m.items.map((f) => ({
                name: f.name,
                mealType: m.type,
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fats: f.fats,
            }))
        ) || []

        // Build response
        if (category && MEAL_DATABASE[category]) {
            // Single category
            const meals = MEAL_DATABASE[category]
            // Sort: preferred goal first, then others
            const sorted = [...meals].sort((a, b) => {
                const aMatch = a.tags.includes(preferredTag) ? 0 : 1
                const bMatch = b.tags.includes(preferredTag) ? 0 : 1
                return aMatch - bMatch
            })

            return NextResponse.json({
                category,
                meals: sorted,
                yesterdayMeals: yesterdayMeals.filter(
                    (m) => m.mealType.toLowerCase() === category.toLowerCase()
                ),
                userGoal,
            })
        }

        // All categories
        const allMeals: Record<string, typeof MEAL_DATABASE.desayuno> = {}
        for (const [cat, meals] of Object.entries(MEAL_DATABASE)) {
            allMeals[cat] = [...meals].sort((a, b) => {
                const aMatch = a.tags.includes(preferredTag) ? 0 : 1
                const bMatch = b.tags.includes(preferredTag) ? 0 : 1
                return aMatch - bMatch
            })
        }

        return NextResponse.json({
            meals: allMeals,
            yesterdayMeals,
            userGoal,
        })
    } catch (error) {
        console.error("Error fetching meals:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
