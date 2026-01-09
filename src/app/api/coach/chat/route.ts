import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { buildUserContext, buildFullPrompt } from "@/lib/coach-prompt"
import OpenAI from "openai"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "No autorizado" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            })
        }

        const { message, conversationHistory = [] } = await request.json()

        if (!message || typeof message !== "string") {
            return new Response(JSON.stringify({ error: "Mensaje requerido" }), {
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
            ...conversationHistory.slice(-10).map((msg: { role: string; content: string }) => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            })),
            { role: "user", content: message },
        ]

        // Create streaming response
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            stream: true,
            max_tokens: 500,
            temperature: 0.7,
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
    } catch (error) {
        console.error("Coach chat error:", error)
        return new Response(
            JSON.stringify({ error: "Error al procesar mensaje" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        )
    }
}
