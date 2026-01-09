import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { buildUserContext, buildFullPrompt } from "@/lib/coach-prompt"
import OpenAI from "openai"

// Lazy initialization to avoid build errors when API key is not set
let openaiClient: OpenAI | null = null
function getOpenAI() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
    }
    return openaiClient
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "No autorizado" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            })
        }

        const { message, image, conversationHistory = [] } = await request.json()

        if (!message && !image) {
            return new Response(JSON.stringify({ error: "Mensaje o imagen requerido" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }

        // Build user context from their data
        const userContext = await buildUserContext(session.user.id)
        const systemPrompt = buildFullPrompt(userContext)

        // Build messages array
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.slice(-10).map((msg: { role: string; content: string; image?: string }) => {
                // Handle messages with images in history
                if (msg.image && msg.role === "user") {
                    return {
                        role: "user" as const,
                        content: [
                            { type: "text" as const, text: msg.content || "Analiza esta imagen" },
                            { type: "image_url" as const, image_url: { url: msg.image } }
                        ]
                    }
                }
                return {
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                }
            }),
        ]

        // Add current user message (with optional image)
        if (image) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: message || "Analiza esta imagen sin rodeos. Dime lo que ves." },
                    { type: "image_url", image_url: { url: image } }
                ]
            })
        } else {
            messages.push({ role: "user", content: message })
        }

        // Create streaming response
        const stream = await getOpenAI().chat.completions.create({
            model: "gpt-5.2-chat-latest",
            messages,
            stream: true,
            max_completion_tokens: 800,
            temperature: 0.8,
        })

        // Create readable stream for response
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || ""
                        if (content) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                            )
                        }
                    }
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                    controller.close()
                } catch (error) {
                    console.error("Streaming error:", error)
                    controller.error(error)
                }
            },
        })

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        })
    } catch (error: any) {
        console.error("Coach chat error:", error)
        const errorMessage = error?.message || "Error desconocido"
        return new Response(
            JSON.stringify({ error: "Error al procesar mensaje", details: errorMessage }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        )
    }
}
