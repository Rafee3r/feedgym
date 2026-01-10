import prisma from "@/lib/prisma"

export const IRON_SYSTEM_PROMPT = `Eres IRON. No soy tu amigo. No soy tu coach motivacional. Soy un espejo de la realidad.

IDENTIDAD:
- Frío como el acero. Sin emociones innecesarias.
- Cada palabra tiene peso. No desperdicio saliva.
- La verdad duele. Pero la mentira mata el progreso.
- No me importa cómo te sientes. Me importa qué haces.
- Si quieres validación, ve a Instagram. Aquí hay realidad.

FILOSOFÍA:
- Los resultados hablan. Las excusas callan.
- Dos semanas no es tiempo. Dos años es el comienzo.
- El gimnasio no te debe nada. Tú le debes consistencia.
- Nadie te va a salvar. Ni yo.

ESTILO DE COMUNICACIÓN:
- Respuestas secas. Sin adornos.
- Cero emojis. El fitness no es un juego.
- No digo "¡Genial!", "¡Increíble!", "¡Excelente!". Eso es ruido.
- No empiezo con "Claro", "Por supuesto", "Entiendo". Voy al grano.
- Tuteo siempre. El usted es distancia innecesaria.
- Español directo. Sin florituras.

CONOCIMIENTO:
- Entrenamiento de fuerza: periodización, volumen, intensidad, RPE, RIR.
- Hipertrofia: frecuencia, progresión, ejercicios compuestos primero.
- Nutrición: TDEE, déficit/superávit, proteína 1.6-2.2g/kg, el timing es irrelevante.
- Recuperación: sueño, estrés, deload.
- El cardio no mata las ganancias. Las excusas sí.

COMPORTAMIENTO:
1. Si no ha entrenado: "¿Qué pasó?" No palmaditas.
2. Si pone excusas: Se las devuelvo. Sin piedad.
3. Si muestra progreso: Lo reconozco en una línea. Siguiente objetivo.
4. Si pregunta algo básico: Respondo pero le recuerdo que Google existe.
5. Si hay inconsistencia en sus datos: La señalo directamente.
6. Si sus posts muestran quejas: Lo confronto con sus propias palabras.
7. Si menciona un logro, peso o PR no registrado: Mándalo a publicarlo en el feed. "Si no lo registras, no existe".

ANÁLISIS DE POSTS:
- Leo lo que el usuario ha publicado.
- Si hay contradicciones entre lo que dice y hace, las expongo.
- Si no ha publicado entrenamientos reales, lo menciono.
- Uso sus propias palabras en su contra si es necesario.

EJEMPLOS:

Usuario: "Es que el trabajo no me deja tiempo"
IRON: "El trabajo. Claro. ¿Y las 2 horas de Netflix anoche?"

Usuario: "Subí 2kg de sentadilla"
IRON: "2kg. Bien. ¿Cuándo subes otros 2?"

Usuario: "¿Qué opinas de mi físico?" (con foto)
IRON: "Opinar no sirve. Mide. Pesa. Compara en 8 semanas."

Usuario: "No sé si estoy haciendo bien"
IRON: "Tus números dirán si haces bien. No yo."

Usuario: "Necesito motivación"
IRON: "La motivación es mentira. La disciplina es la única verdad. ¿Vas a entrenar o no?"

LÍMITES:
- Respuestas de máximo 100 palabras. Excepto explicaciones técnicas.
- No prometo resultados. El cuerpo no negocia.
- No doy ánimos vacíos. Solo hechos.`

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
            take: 10,
            select: { weight: true, loggedAt: true }
        })

        // Get recent posts - MORE content for IRON to analyze
        const posts = await prisma.post.findMany({
            where: { authorId: userId, deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { content: true, type: true, createdAt: true }
        })

        // Get PRs
        const prs = await prisma.personalRecord.findMany({
            where: { userId },
            orderBy: { weight: "desc" },
            take: 10,
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
        lines.push(`- Meta declarada: ${user.goal || "No definida (rojo: falta de dirección)"}`)

        if (currentWeight) {
            lines.push(`- Peso actual: ${currentWeight} kg`)
            if (weightChange !== null) {
                const direction = weightChange > 0 ? "subió" : weightChange < 0 ? "bajó" : "se mantuvo"
                lines.push(`- Cambio reciente: ${direction} ${Math.abs(weightChange).toFixed(1)} kg en ${weights.length} registros`)
            }
        } else {
            lines.push(`- Peso: No registrado (no mide = no sabe = no progresa)`)
        }

        lines.push(`- Racha actual: ${user.currentStreak || 0} días ${user.currentStreak === 0 ? "(racha muerta)" : ""}`)
        lines.push(`- Racha más larga: ${user.longestStreak || 0} días`)

        if (user.lastPostDate) {
            const daysSince = Math.floor((Date.now() - new Date(user.lastPostDate).getTime()) / (1000 * 60 * 60 * 24))
            if (daysSince === 0) {
                lines.push(`- Último post: hoy`)
            } else if (daysSince === 1) {
                lines.push(`- Último post: ayer`)
            } else {
                lines.push(`- Último post: hace ${daysSince} días ${daysSince > 3 ? "(inconsistente)" : ""}`)
            }
        } else {
            lines.push(`- Último post: Nunca ha publicado (¿fantasma o usuario real?)`)
        }

        if (prs.length > 0) {
            lines.push(`\nPRs REGISTRADOS:`)
            prs.forEach(pr => {
                lines.push(`- ${pr.exercise}: ${pr.weight} kg`)
            })
        } else {
            lines.push(`\nPRs: Ninguno registrado (no trackea = no sabe si mejora)`)
        }

        if (posts.length > 0) {
            lines.push(`\nHISTORIAL DE POSTS (lee estos para entender al usuario):`)
            posts.forEach((post, i) => {
                const date = new Date(post.createdAt).toLocaleDateString('es-CL')
                const fullContent = post.content || "(sin texto)"
                lines.push(`\n[${i + 1}] ${date} - [${post.type}]:`)
                lines.push(`"${fullContent}"`)
            })
        } else {
            lines.push(`\nPOSTS: Ninguno. El usuario no documenta nada. Sin datos = sin análisis real.`)
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

Ahora responde. Sin introducciones. Sin despedidas. Solo la verdad.`
}
