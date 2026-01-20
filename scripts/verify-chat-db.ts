
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing DB connection...')

    // 1. Get a user
    const user = await prisma.user.findFirst()
    if (!user) {
        console.error('No users found in DB. Cannot test.')
        return
    }
    console.log(`Found user: ${user.email} (${user.id})`)

    // 2. Write a test message
    console.log('Attempting to create a CoachMessage...')
    const testContent = `Test message at ${new Date().toISOString()}`
    try {
        const msg = await prisma.coachMessage.create({
            data: {
                userId: user.id,
                role: 'user',
                content: testContent
            }
        })
        console.log('SUCCESS: Created message:', msg.id)
    } catch (e) {
        console.error('FAILED to create message:', e)
    }

    // 3. Read it back
    console.log('Reading back history...')
    const history = await prisma.coachMessage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    console.log(`Found ${history.length} messages.`)
    history.forEach(h => console.log(`- [${h.role}] ${h.content.substring(0, 50)}...`))

    if (history.some(h => h.content === testContent)) {
        console.log('VERIFIED: Test message found in history.')
    } else {
        console.error('FAILED: Test message NOT found in history.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
