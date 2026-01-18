import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpenAI } from "@/lib/openai";
import prisma from "@/lib/prisma";

// Determine meal type based on current time (Santiago timezone)
function getMealTypeByTime(): string {
    const now = new Date();
    const santiagoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Santiago" }));
    const hour = santiagoTime.getHours();

    if (hour >= 5 && hour < 11) return "desayuno";
    if (hour >= 11 && hour < 15) return "almuerzo";
    if (hour >= 15 && hour < 18) return "snack";
    return "cena";
}

function getMealTypeLabel(type: string): string {
    switch (type) {
        case "desayuno": return "desayuno";
        case "almuerzo": return "almuerzo";
        case "cena": return "cena";
        case "snack": return "snack";
        case "BREAKFAST": return "desayuno";
        case "LUNCH": return "almuerzo";
        case "DINNER": return "cena";
        case "SNACK": return "snack";
        default: return "almuerzo";
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { mealType, simpler = false, goal } = body;

        // Use provided mealType or determine by time
        const effectiveMealType = mealType ? getMealTypeLabel(mealType) : getMealTypeByTime();

        // Fetch user profile for goal
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { goal: true }
        });
        const userGoal = goal || user?.goal || "MAINTAIN";

        // Fetch Kitchen Inventory
        const inventory = await prisma.kitchenItem.findMany({
            where: { userId: session.user.id },
            select: { name: true }
        });

        const ingredients = inventory.map(i => i.name).join(", ");

        // Build context based on goal
        let goalContext = "";
        if (userGoal === "CUT") {
            goalContext = "El usuario está en DÉFICIT CALÓRICO (fase de corte). Prioriza proteína alta, bajo en calorías, ingredientes saciantes.";
        } else if (userGoal === "BULK") {
            goalContext = "El usuario está en SUPERÁVIT (fase de volumen). Incluye más calorías y carbohidratos para ganar masa muscular.";
        } else {
            goalContext = "El usuario mantiene su peso. Sugiere comidas balanceadas y nutritivas.";
        }

        // Build simplicity context
        const simpleContext = simpler
            ? "IMPORTANTE: El usuario quiere algo MÁS SIMPLE y RÁPIDO. Sugiere una receta que tome máximo 10-15 minutos, pocos ingredientes, pero que sea sabrosa y satisfactoria."
            : "";

        const openai = getOpenAI();

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres IRON, un entrenador de élite y experto en nutrición deportiva. 
                    ${goalContext}
                    ${simpleContext}
                    RESPONDE SIEMPRE EN ESPAÑOL.`
                },
                {
                    role: "user",
                    content: `Sugiere una receta saludable para ${effectiveMealType} usando algunos de estos ingredientes si están disponibles: [${ingredients || "ingredientes básicos de cocina"}]. 
                    ${simpler ? "Receta SIMPLE y RÁPIDA (máx 15 min, pocos pasos)." : "Puede ser una receta normal."}
                    
                    Devuelve un objeto JSON con:
                    {
                        "name": "nombre del plato",
                        "description": "breve descripción apetitosa",
                        "calories": número,
                        "protein": número,
                        "carbs": número,
                        "fats": número,
                        "prepTime": número (minutos),
                        "tags": ["tag1", "tag2"]
                    }
                    
                    Manténlo realista. Responde en Español.`
                },
            ],
            response_format: { type: "json_object" },
            max_tokens: 400,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content from AI");

        const data = JSON.parse(content);

        // Ensure all fields exist with defaults
        const result = {
            name: data.name || "Comida recomendada",
            description: data.description || "",
            calories: Math.round(data.calories) || 400,
            protein: Math.round(data.protein) || 25,
            carbs: Math.round(data.carbs) || 40,
            fats: Math.round(data.fats) || 15,
            prepTime: data.prepTime || (simpler ? 10 : 20),
            tags: data.tags || [userGoal.toLowerCase()],
            mealType: effectiveMealType
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error("AI Recommend Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
