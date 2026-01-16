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
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are IRON, an elite fitness and nutrition coach. Suggest a meal based on available ingredients."
                },
                {
                    role: "user",
                    content: `Suggest a healthy ${mealType} using some of these ingredients: [${ingredients}]. 
                    If the list is empty, suggest a generic healthy ${mealType}. 
                    Return a JSON object: { name: string, description: string, calories: number, protein: number, carbs: number, fats: number, unit: "serving", quantity: 1 }. 
                    Keep it simple and realistic.`
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
