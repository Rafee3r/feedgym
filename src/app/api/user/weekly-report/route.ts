import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getOpenAI } from "@/lib/openai"

// GET /api/user/weekly-report - Generate AI weekly report
export async function GET() {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Get posts from last 7 days (WORKOUT and PR types)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const weekPosts = await prisma.post.findMany({
            where: {
                authorId: session.user.id,
                type: { in: ["WORKOUT", "PR"] },
                deletedAt: null,
                createdAt: { gte: sevenDaysAgo },
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                content: true,
                type: true,
                metadata: true,
                createdAt: true,
            },
        })

        // Get all user PRs
        const allPRs = await prisma.personalRecord.findMany({
            where: { userId: session.user.id },
            orderBy: { weight: "desc" },
        })

        // Group PRs by exercise (best per exercise)
        const bestPRs = new Map<string, typeof allPRs[0]>()
        for (const pr of allPRs) {
            const key = pr.exercise.toLowerCase().trim()
            const existing = bestPRs.get(key)
            if (!existing || pr.weight > existing.weight) {
                bestPRs.set(key, pr)
            }
        }

        const prsText = Array.from(bestPRs.values())
            .map(pr => `- ${pr.exercise}: ${pr.weight}${pr.unit === "KG" ? "kg" : "lb"} x${pr.reps}`)
            .join("\n")

        const postsText = weekPosts.map(p => {
            const meta = p.metadata as any
            const metaStr = meta
                ? ` [${meta.exercise || ""}${meta.weight ? ` ${meta.weight}${meta.unit || "KG"}` : ""}${meta.sets ? ` ${meta.sets}x${meta.reps || "?"}` : ""}${meta.rpe ? ` RPE${meta.rpe}` : ""}]`
                : ""
            return `- ${p.type} (${new Date(p.createdAt).toLocaleDateString("es-CL")}): "${p.content.slice(0, 150)}"${metaStr}`
        }).join("\n")

        // Get user info for context
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { displayName: true, goal: true, targetWeight: true },
        })

        if (weekPosts.length === 0 && bestPRs.size === 0) {
            return NextResponse.json({
                report: "No hay datos suficientes para generar un reporte esta semana. ¡Publica tus entrenamientos y PRs para que pueda analizar tu progreso!",
                generatedAt: new Date().toISOString(),
                postsAnalyzed: 0,
                prsCount: 0,
            })
        }

        // Generate AI report
        const openai = getOpenAI()
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres un coach fitness experto y directo. Genera un reporte semanal BREVE (máximo 150 palabras) en español.
                    
El reporte debe incluir:
1. Resumen de la semana: qué ejercicios hizo, frecuencia
2. Análisis de PRs: dónde puede mejorar, qué está cerca de superar
3. Un mensaje motivacional directo y personal para pushear más arriba

Formato: usa emojis moderadamente. Sé conciso y directo. No uses listas largas.
El objetivo del usuario es: ${user?.goal || "MAINTAIN"}.
Nombre del usuario: ${user?.displayName || "Atleta"}.`
                },
                {
                    role: "user",
                    content: `POSTS DE ENTRENAMIENTO ESTA SEMANA (${weekPosts.length} total):
${postsText || "(Sin posts de entrenamiento esta semana)"}

PRs ACTUALES:
${prsText || "(Sin PRs registrados)"}

Genera el reporte semanal.`
                }
            ],
            max_tokens: 300,
        })

        const report = completion.choices[0]?.message?.content?.trim() || "No se pudo generar el reporte."

        return NextResponse.json({
            report,
            generatedAt: new Date().toISOString(),
            postsAnalyzed: weekPosts.length,
            prsCount: bestPRs.size,
        })
    } catch (error) {
        console.error("Weekly report error:", error)
        return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 })
    }
}
