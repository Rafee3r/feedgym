import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/admin/create-iron - Show a simple page to create IRON
export async function GET() {
    const session = await auth()

    if (!session?.user || session.user.username !== "rafael") {
        return new Response("Unauthorized - Only rafael can access this", { status: 401 })
    }

    // Return a simple HTML page with a button
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Create IRON</title>
        <style>
            body { font-family: system-ui; background: #0a0a0a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
            button { background: #22c55e; color: white; border: none; padding: 16px 32px; font-size: 18px; border-radius: 8px; cursor: pointer; }
            button:hover { background: #16a34a; }
            #result { margin-top: 20px; padding: 16px; border-radius: 8px; }
            .success { background: #22c55e20; border: 1px solid #22c55e; }
            .error { background: #ef444420; border: 1px solid #ef4444; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Create IRON Bot</h1>
            <p>Click the button below to create the IRON user profile.</p>
            <button onclick="createIron()">Create IRON</button>
            <div id="result"></div>
        </div>
        <script>
            async function createIron() {
                const result = document.getElementById('result');
                result.textContent = 'Creating IRON...';
                result.className = '';
                
                try {
                    const res = await fetch('/api/admin/create-iron', { method: 'POST' });
                    const data = await res.json();
                    result.textContent = data.message || data.error;
                    result.className = res.ok ? 'success' : 'error';
                } catch (e) {
                    result.textContent = 'Error: ' + e.message;
                    result.className = 'error';
                }
            }
        </script>
    </body>
    </html>
    `

    return new Response(html, {
        headers: { "Content-Type": "text/html" }
    })
}

// POST /api/admin/create-iron - Create the IRON bot user (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await auth()

        // Only allow authenticated users with specific username (admin)
        if (!session?.user || session.user.username !== "rafael") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if IRON already exists
        const existingIron = await prisma.user.findUnique({
            where: { username: "iron" }
        })

        if (existingIron) {
            return NextResponse.json({
                message: "IRON already exists",
                user: { id: existingIron.id, username: existingIron.username }
            })
        }

        // Create IRON user
        const iron = await prisma.user.create({
            data: {
                email: "iron@feedgym.ai",
                username: "iron",
                displayName: "IRON",
                bio: "Tu coach virtual. Sin excusas. Solo resultados.",
                avatarUrl: null, // Will use default "I" avatar
                onboardingCompleted: true,
                tutorialCompleted: true,
                accountPrivacy: "PUBLIC",
            }
        })

        return NextResponse.json({
            message: "IRON created successfully",
            user: { id: iron.id, username: iron.username }
        })

    } catch (error) {
        console.error("Create IRON error:", error)
        return NextResponse.json({ error: "Failed to create IRON" }, { status: 500 })
    }
}
