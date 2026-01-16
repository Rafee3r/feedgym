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
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a nutritional expert AI. Your task is to analyze food images and provide nutritional estimates. Return ONLY a valid JSON object with no markdown formatting."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this food image. Identify the main dish or components. Estimate the calories, protein, carbs, and fats for the visible portion. Return a JSON with: { name: string, calories: number, protein: number, carbs: number, fats: number, unit: string (e.g. 'plate', 'bowl', 'serving'), quantity: number }. If multiple items, aggregate them into one main entry or pick the most prominent one." },
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
