import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/admin/update-iron - Show page to update IRON profile
export async function GET() {
    const session = await auth()

    if (!session?.user || session.user.username !== "rafael") {
        return new Response("Unauthorized", { status: 401 })
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Update IRON Profile</title>
        <style>
            body { font-family: system-ui; background: #0a0a0a; color: white; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { margin-bottom: 24px; }
            label { display: block; margin: 16px 0 8px; font-weight: 600; }
            input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #333; background: #1a1a1a; color: white; font-size: 14px; }
            button { background: #22c55e; color: white; border: none; padding: 16px 32px; font-size: 16px; border-radius: 8px; cursor: pointer; margin-top: 24px; }
            button:hover { background: #16a34a; }
            #result { margin-top: 20px; padding: 16px; border-radius: 8px; }
            .success { background: #22c55e20; border: 1px solid #22c55e; }
            .error { background: #ef444420; border: 1px solid #ef4444; }
            .preview { margin-top: 20px; }
            .preview img { max-width: 100%; border-radius: 8px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Update IRON Profile</h1>
            
            <label>Avatar URL (for white I logo, use a data URL or hosted image)</label>
            <input type="text" id="avatarUrl" placeholder="https://..." />
            
            <label>Banner URL</label>
            <input type="text" id="bannerUrl" placeholder="https://..." />
            
            <label>Bio</label>
            <textarea id="bio" rows="3">Tu coach virtual. Sin excusas. Solo resultados.</textarea>
            
            <button onclick="updateIron()">Update IRON</button>
            <button onclick="setDefaultAssets()" style="background: #3b82f6;">Set Default Assets</button>
            
            <div id="result"></div>
        </div>
        <script>
            function setDefaultAssets() {
                // SVG data URL for white "I" on black circle
                document.getElementById('avatarUrl').value = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTAwIiBmaWxsPSJibGFjayIvPgo8dGV4dCB4PSI1MCUiIHk9IjU1JSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTIwIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiI+STwvdGV4dD4KPC9zdmc+';
                // Dark gradient banner
                document.getElementById('bannerUrl').value = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMTIwMCIgeTI9IjQwMCI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxYTFhMWEiLz4KPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwYTBhMGEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMWExYTFhIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+';
            }
            
            async function updateIron() {
                const result = document.getElementById('result');
                result.textContent = 'Updating IRON...';
                result.className = '';
                
                try {
                    const res = await fetch('/api/admin/update-iron', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            avatarUrl: document.getElementById('avatarUrl').value || null,
                            bannerUrl: document.getElementById('bannerUrl').value || null,
                            bio: document.getElementById('bio').value || null
                        })
                    });
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

    return new Response(html, { headers: { "Content-Type": "text/html" } })
}

// POST /api/admin/update-iron - Update IRON profile
export async function POST(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user || session.user.username !== "rafael") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { avatarUrl, bannerUrl, bio } = await req.json()

        const iron = await prisma.user.update({
            where: { username: "iron" },
            data: {
                ...(avatarUrl !== undefined && { avatarUrl }),
                ...(bannerUrl !== undefined && { bannerUrl }),
                ...(bio !== undefined && { bio }),
            }
        })

        return NextResponse.json({
            message: "IRON updated successfully",
            user: { id: iron.id, avatarUrl: iron.avatarUrl, bannerUrl: iron.bannerUrl }
        })

    } catch (error) {
        console.error("Update IRON error:", error)
        return NextResponse.json({ error: "Failed to update IRON" }, { status: 500 })
    }
}
