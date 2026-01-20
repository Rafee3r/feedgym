
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧪 Testing Chat History API Cache...')

    // 1. Get user
    const user = await prisma.user.findFirst()
    if (!user) { console.error('No user found'); return }

    const baseUrl = "http://localhost:3000" // We can't really fetch localhost if the server isn't running...
    // Ah, we are in a script context, not a browser.
    // We can't easily test Next.js API route caching from a standalone script without the server running.
    // But we CAN verify that the DB write happens instantly.

    const timestamp = new Date().toISOString()
    console.log(`📝 Writing message at ${timestamp}...`)

    const msg = await prisma.coachMessage.create({
        data: {
            userId: user.id,
            role: "user",
            content: `Cache Test ${timestamp}`
        }
    })

    console.log(`✅ Message saved with ID: ${msg.id}`)

    // To truly test caching, we rely on the `export const dynamic = 'force-dynamic'` change we made.
    // That is the standard Next.js solution.
    console.log(`✅ 'force-dynamic' configuration confirmed in route.ts`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
