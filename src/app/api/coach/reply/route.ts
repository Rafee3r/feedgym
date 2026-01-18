import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { buildUserContext, buildFullPrompt } from "@/lib/coach-prompt"
import { getOpenAI } from "@/lib/openai"

// POST /api/coach/reply - IRON auto-replies when mentioned in a post
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { postId, parentId, content } = await req.json()

        if (!postId || !content) {
            return NextResponse.json({ error: "Missing postId or content" }, { status: 400 })
        }

        // Check if IRON is mentioned
        const ironMentioned = content.toLowerCase().includes("@iron")
        if (!ironMentioned) {
            return NextResponse.json({ message: "IRON not mentioned" })
        }

        // Get IRON user
        const ironUser = await prisma.user.findUnique({
            where: { username: "iron" }
        })

        if (!ironUser) {
            return NextResponse.json({ error: "IRON user not found" }, { status: 404 })
        }

        // Get original post author context (the person who mentioned IRON)
        const userContext = await buildUserContext(session.user.id)
        const systemPrompt = buildFullPrompt(userContext)

        // Generate IRON's response
        const openai = getOpenAI()
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: content }
            ],
            max_tokens: 400,
            temperature: 0.7,
        })

        const ironResponse = completion.choices[0]?.message?.content
        if (!ironResponse) {
            return NextResponse.json({ error: "No response generated" }, { status: 500 })
        }

        // Create IRON's reply post as a response to the original
        const replyPost = await prisma.post.create({
            data: {
                content: ironResponse,
                type: "NOTE",
                authorId: ironUser.id,
                parentId: postId, // Reply to the post that mentioned IRON
            }
        })

        return NextResponse.json({
            success: true,
            reply: {
                id: replyPost.id,
                content: ironResponse,
            }
        })

    } catch (error) {
        console.error("IRON reply error:", error)
        return NextResponse.json({ error: "Failed to generate IRON reply" }, { status: 500 })
    }
}
