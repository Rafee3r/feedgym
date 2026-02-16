import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/media/[postId]?idx=0
// Serves a single image from a post's mediaUrls array.
// If the stored value is a base64 data URI, it decodes and serves it as binary.
// If it's a normal URL, it redirects.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    const { postId } = await params
    const idx = parseInt(request.nextUrl.searchParams.get("idx") || "0", 10)

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { mediaUrls: true, imageUrl: true },
        })

        if (!post) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        const mediaUrls = (post as any).mediaUrls as string[] | null
        let targetUrl: string | null = null

        if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls[idx]) {
            targetUrl = mediaUrls[idx]
        } else if (idx === 0 && post.imageUrl) {
            targetUrl = post.imageUrl
        }

        if (!targetUrl) {
            return NextResponse.json({ error: "Media not found" }, { status: 404 })
        }

        // If it's a regular URL, redirect to it
        if (!targetUrl.startsWith("data:")) {
            return NextResponse.redirect(targetUrl)
        }

        // Parse base64 data URI: data:image/jpeg;base64,/9j/4AAQ...
        const match = targetUrl.match(/^data:([^;]+);base64,(.+)$/)
        if (!match) {
            return NextResponse.json({ error: "Invalid media format" }, { status: 500 })
        }

        const contentType = match[1]
        const base64Data = match[2]
        const buffer = Buffer.from(base64Data, "base64")

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Content-Length": buffer.length.toString(),
            },
        })
    } catch (error) {
        console.error("Media proxy error:", error)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
