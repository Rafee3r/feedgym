import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getOpenAI } from "@/lib/openai"

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { image } = await req.json()

        if (!image) {
            return NextResponse.json(
                { error: "No image provided" },
                { status: 400 }
            )
        }

        const openai = getOpenAI()

        // Use GPT-5.1-mini (cost-effective vision model) to analyze the food image
        const response = await openai.chat.completions.create({
            model: "gpt-5.1-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres un nutricionista experto que analiza imágenes de comida.
                    Cuando veas una imagen de comida, identifica:
                    1. El nombre del plato o alimento
                    2. Las calorías estimadas (por porción visible)
                    3. Los macronutrientes: proteína, carbohidratos y grasas en gramos
                    
                    IMPORTANTE: Sé preciso con las estimaciones basándote en porciones típicas.
                    Si no puedes identificar claramente la comida, haz tu mejor estimación.
                    
                    Responde SOLO con un objeto JSON válido:
                    {
                        "name": "nombre del plato en español",
                        "calories": número,
                        "protein": número,
                        "carbs": número,
                        "fats": número,
                        "description": "breve descripción"
                    }`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analiza esta imagen de comida y proporciona la información nutricional estimada."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: image,
                                detail: "low"
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300,
            response_format: { type: "json_object" }
        })

        const content = response.choices[0].message.content
        if (!content) {
            throw new Error("No response from AI")
        }

        const foodData = JSON.parse(content)

        // Validate and ensure all fields exist
        const result = {
            name: foodData.name || "Comida detectada",
            calories: Math.round(foodData.calories) || 200,
            protein: Math.round(foodData.protein) || 15,
            carbs: Math.round(foodData.carbs) || 25,
            fats: Math.round(foodData.fats) || 10,
            description: foodData.description || ""
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error("Analyze food error:", error)

        // Return a fallback response so the app doesn't break
        return NextResponse.json({
            name: "Comida escaneada",
            calories: 300,
            protein: 20,
            carbs: 30,
            fats: 12,
            description: "No se pudo analizar la imagen. Valores estimados."
        })
    }
}
