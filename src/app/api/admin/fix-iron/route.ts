import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/admin/fix-iron - Show page to fix duplicate IRON users
export async function GET() {
    const session = await auth()

    if (!session?.user || session.user.username !== "rafael") {
        return new Response("Unauthorized", { status: 401 })
    }

    // Find all IRON-like users
    const ironUsers = await prisma.user.findMany({
        where: {
            username: { contains: "iron", mode: "insensitive" }
        },
        select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            _count: {
                select: { posts: true }
            }
        }
    })

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Fix IRON Users</title>
        <style>
            body { font-family: system-ui; background: #0a0a0a; color: white; padding: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { margin-bottom: 24px; }
            .user-card { background: #1a1a1a; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #333; }
            .user-card h3 { margin: 0 0 8px 0; }
            .user-card p { margin: 4px 0; color: #888; font-size: 14px; }
            button { background: #22c55e; color: white; border: none; padding: 12px 24px; font-size: 14px; border-radius: 8px; cursor: pointer; margin-top: 16px; }
            button:hover { background: #16a34a; }
            button.danger { background: #ef4444; }
            button.danger:hover { background: #dc2626; }
            #result { margin-top: 20px; padding: 16px; border-radius: 8px; }
            .success { background: #22c55e20; border: 1px solid #22c55e; }
            .error { background: #ef444420; border: 1px solid #ef4444; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔧 Fix IRON Users</h1>
            <p>Found ${ironUsers.length} IRON-related users:</p>
            
            ${ironUsers.map(u => `
                <div class="user-card">
                    <h3>@${u.username} (${u.displayName})</h3>
                    <p>ID: ${u.id}</p>
                    <p>Email: ${u.email}</p>
                    <p>Posts: ${u._count.posts}</p>
                    <p>Avatar: ${u.avatarUrl ? '✅ Set' : '❌ None'}</p>
                </div>
            `).join('')}
            
            <h2>Actions</h2>
            <button onclick="fixIron()">🔧 Merge & Fix IRON</button>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">
                This will: 1) Keep the user with most posts as "iron", 2) Transfer all posts from duplicates, 3) Delete duplicates, 4) Set avatar
            </p>
            
            <div id="result"></div>
        </div>
        <script>
            async function fixIron() {
                const result = document.getElementById('result');
                result.textContent = 'Fixing IRON...';
                result.className = '';
                
                try {
                    const res = await fetch('/api/admin/fix-iron', { method: 'POST' });
                    const data = await res.json();
                    result.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
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

// POST /api/admin/fix-iron - Merge and fix IRON users
export async function POST(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user || session.user.username !== "rafael") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find all IRON-like users
        const ironUsers = await prisma.user.findMany({
            where: {
                username: { contains: "iron", mode: "insensitive" }
            },
            include: {
                _count: { select: { posts: true } }
            }
        })

        if (ironUsers.length === 0) {
            return NextResponse.json({ error: "No IRON users found" }, { status: 404 })
        }

        // Sort by post count descending - keep the one with most posts
        ironUsers.sort((a, b) => b._count.posts - a._count.posts)

        const primaryIron = ironUsers[0]
        const duplicates = ironUsers.slice(1)

        const results: any = {
            primaryUser: { id: primaryIron.id, username: primaryIron.username, posts: primaryIron._count.posts },
            duplicatesRemoved: [],
            postsTransferred: 0
        }

        // Transfer posts from duplicates to primary
        for (const dup of duplicates) {
            // Transfer all posts
            const updated = await prisma.post.updateMany({
                where: { authorId: dup.id },
                data: { authorId: primaryIron.id }
            })
            results.postsTransferred += updated.count

            // Delete duplicate user
            await prisma.user.delete({ where: { id: dup.id } })
            results.duplicatesRemoved.push({ id: dup.id, username: dup.username })
        }

        // Update primary IRON user with correct data
        const avatarUrl = "https://api.dicebear.com/9.x/initials/svg?seed=I&backgroundColor=000000&textColor=ffffff&fontSize=50"
        const bannerUrl = "https://api.dicebear.com/9.x/shapes/svg?seed=iron&backgroundColor=1a1a1a,0a0a0a"

        await prisma.user.update({
            where: { id: primaryIron.id },
            data: {
                username: "iron",
                displayName: "IRON",
                email: "iron@feedgym.ai",
                bio: "Tu coach virtual. Sin excusas. Solo resultados.",
                avatarUrl,
                bannerUrl,
                onboardingCompleted: true,
                tutorialCompleted: true,
            }
        })

        results.updated = {
            username: "iron",
            avatarUrl: "✅ Set",
            bannerUrl: "✅ Set"
        }

        return NextResponse.json({
            success: true,
            message: "IRON fixed successfully",
            ...results
        })

    } catch (error: any) {
        console.error("Fix IRON error:", error)
        return NextResponse.json({ error: "Failed to fix IRON", details: error.message }, { status: 500 })
    }
}
