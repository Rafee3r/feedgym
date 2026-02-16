import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/avatar/[userId]
// Serves a user's avatar. If stored as base64, decodes and serves as binary.
// If it's a normal URL, redirects. Cached aggressively by the browser.
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        })

        if (!user || !user.avatarUrl) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        const url = user.avatarUrl

        // Regular URL → redirect
        if (!url.startsWith("data:")) {
            return NextResponse.redirect(url)
        }

        // Parse base64 data URI
        const match = url.match(/^data:([^;]+);base64,(.+)$/)
        if (!match) {
            return NextResponse.json({ error: "Invalid format" }, { status: 500 })
        }

        const contentType = match[1]
        const buffer = Buffer.from(match[2], "base64")

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                "Content-Length": buffer.length.toString(),
            },
        })
    } catch (error) {
        console.error("Avatar proxy error:", error)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
