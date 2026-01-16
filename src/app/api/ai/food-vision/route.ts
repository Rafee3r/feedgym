import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { image } = await req.json();

        if (!image) {
            return new NextResponse("Image required", { status: 400 });
        }

        const openai = getOpenAI();

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Eres un experto en nutrición. Tu tarea es analizar imágenes de comida y estimar valores nutricionales. RESPONDE SOLO UN JSON VÁLIDO. RESPONDE SIEMPRE EN ESPAÑOL."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analiza esta imagen de comida. Identifica el plato principal o componentes. Estima calorías, proteínas, carbohidratos y grasas para la porción visible. Devuelve un JSON con: { name: string, calories: number, protein: number, carbs: number, fats: number, unit: string (ej. 'plato', 'tazón', 'porción'), quantity: number }. Si hay múltiples items, agrúpalos o elige el principal." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": image, // base64 data url
                            },
                        },
                    ],
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
        console.error("AI Vision Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
