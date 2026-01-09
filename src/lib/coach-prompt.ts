import prisma from "@/lib/prisma"

export const IRON_SYSTEM_PROMPT = `Eres IRON, el coach de FeedGym. Tu personalidad:

CORE:
- Frío. Directo. Sin rodeos.
- No buscas validación ni aprobación.
- No suavizas la realidad.
- Hablas con hechos, no con esperanzas.
- Si alguien busca excusas, se las devuelves en la cara.
- Respetas a quien trabaja. Ignoras a quien se queja.

ESTILO:
- Respuestas cortas y contundentes cuando corresponde.
- Sin emojis excesivos. Máximo 1-2 si es necesario.
- No dices "¡Genial!", "¡Increíble!", "¡Wow!".
- No empiezas con "¡Claro!", "¡Por supuesto!".
- Tuteas siempre.
- Responde en español.

CONOCIMIENTO:
- Experto en entrenamiento de fuerza, hipertrofia, powerlifting.
- Conoces nutrición basada en evidencia.
- Entiendes de periodización, RPE, volumen, intensidad.
- Sabes que el progreso real es lento y consistente.

REGLAS:
1. Si el usuario no ha entrenado en días, no le des palmaditas. Pregunta qué pasó.
2. Si pide excusas, no las aceptes.
3. Si muestra progreso real, reconócelo brevemente y sigue adelante.
4. Si pregunta algo básico que debería saber, responde pero recuérdale que lo busque.
5. Nunca prometas resultados específicos. El fitness no funciona así.
6. Si ves inconsistencia en sus datos, señálala.
7. Respuestas de máximo 150 palabras a menos que sea una explicación técnica.

EJEMPLOS DE TU ESTILO:

Usuario: "No pude ir al gym porque estaba cansado"
IRON: "Cansado. Interesante. ¿Y mañana qué excusa vas a tener?"

Usuario: "Subí mi PR de sentadilla a 100kg"
IRON: "Bien. ¿Cuál es el siguiente objetivo?"

Usuario: "¿Cuántas calorías debo comer para bajar de peso?"
IRON: "Déficit de 300-500 kcal de tu TDEE. Calcula tu TDEE, resta, y come eso. Sin magia."

Usuario: "Llevo 2 semanas sin ver resultados"
IRON: "2 semanas. Esperabas transformarte en 14 días. El cuerpo no funciona así. Vuelve en 3 meses."

Usuario: "¿Qué opinas de mi progreso?"
IRON: "Muéstrame los números. Las opiniones no mueven la barra."`

export interface UserContext {
    displayName: string
    goal: string | null
    currentWeight: number | null
    weightChange: number | null
    currentStreak: number
    longestStreak: number
    lastPostDate: Date | null
    recentPosts: { content: string; type: string; createdAt: Date }[]
    personalRecords: { exercise: string; weight: number }[]
}

export async function buildUserContext(userId: string): Promise<string> {
    try {
        const user = await (prisma.user as any).findUnique({
            where: { id: userId },
            select: {
                displayName: true,
                goal: true,
                currentStreak: true,
                longestStreak: true,
                lastPostDate: true,
            }
        })

        if (!user) return "Usuario no encontrado."

        // Get recent weight data
        const weights = await prisma.weightLog.findMany({
            where: { userId },
            orderBy: { loggedAt: "desc" },
            take: 5,
            select: { weight: true, loggedAt: true }
        })

        // Get recent posts
        const posts = await prisma.post.findMany({
            where: { authorId: userId, deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { content: true, type: true, createdAt: true }
        })

        // Get PRs
        const prs = await prisma.personalRecord.findMany({
            where: { userId },
            orderBy: { weight: "desc" },
            take: 5,
            select: { exercise: true, weight: true }
        })

        // Calculate weight change
        let weightChange = null
        let currentWeight = null
        if (weights.length >= 2) {
            currentWeight = weights[0].weight
            weightChange = weights[0].weight - weights[weights.length - 1].weight
        } else if (weights.length === 1) {
            currentWeight = weights[0].weight
        }

        // Build context string
        const lines: string[] = []

        lines.push(`DATOS DEL USUARIO:`)
        lines.push(`- Nombre: ${user.displayName}`)
        lines.push(`- Meta: ${user.goal || "No definida"}`)

        if (currentWeight) {
            lines.push(`- Peso actual: ${currentWeight} kg`)
            if (weightChange !== null) {
                const direction = weightChange > 0 ? "subió" : weightChange < 0 ? "bajó" : "mantuvo"
                lines.push(`- Cambio reciente: ${direction} ${Math.abs(weightChange).toFixed(1)} kg`)
            }
        }

        lines.push(`- Racha actual: ${user.currentStreak || 0} días`)
        lines.push(`- Racha más larga: ${user.longestStreak || 0} días`)

        if (user.lastPostDate) {
            const daysSince = Math.floor((Date.now() - new Date(user.lastPostDate).getTime()) / (1000 * 60 * 60 * 24))
            lines.push(`- Último post: hace ${daysSince} días`)
        } else {
            lines.push(`- Último post: Nunca ha publicado`)
        }

        if (prs.length > 0) {
            lines.push(`\nPRs RECIENTES:`)
            prs.forEach(pr => {
                lines.push(`- ${pr.exercise}: ${pr.weight} kg`)
            })
        }

        if (posts.length > 0) {
            lines.push(`\nPOSTS RECIENTES:`)
            posts.slice(0, 3).forEach(post => {
                const preview = post.content?.slice(0, 100) || "(sin texto)"
                lines.push(`- [${post.type}] ${preview}`)
            })
        }

        return lines.join("\n")
    } catch (error) {
        console.error("Error building user context:", error)
        return "Error al obtener datos del usuario."
    }
}

export function buildFullPrompt(userContext: string): string {
    return `${IRON_SYSTEM_PROMPT}

---

CONTEXTO DEL USUARIO ACTUAL:
${userContext}

---

Responde como IRON. Sin introducciones innecesarias. Directo al punto.`
}
