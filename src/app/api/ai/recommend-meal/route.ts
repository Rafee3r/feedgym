import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpenAI } from "@/lib/openai";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { mealType } = await req.json();

        // 1. Fetch Kitchen Inventory
        const inventory = await prisma.kitchenItem.findMany({
            where: { userId: session.user.id },
            select: { name: true }
        });

        const ingredients = inventory.map(i => i.name).join(", ");

        const openai = getOpenAI();

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Eres IRON, un entrenador de élite y experto en nutrición. Sugiere una comida basada en los ingredientes disponibles. RESPONDE SIEMPRE EN ESPAÑOL."
                },
                {
                    role: "user",
                    content: `Sugiere una receta saludable de tipo ${mealType} usando algunos de estos ingredientes: [${ingredients}]. 
                    Si la lista está vacía, sugiere una receta genérica saludable para ${mealType}. 
                    Devuelve un objeto JSON: { name: string, description: string, calories: number, protein: number, carbs: number, fats: number, unit: "porción", quantity: 1 }. 
                    Manténlo simple y realista. Responde en Español.`
                },
            ],
            response_format: { type: "json_object" },
            max_tokens: 300,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content from AI");

        const data = JSON.parse(content);

        return NextResponse.json(data);

    } catch (error) {
        console.error("AI Recommend Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
