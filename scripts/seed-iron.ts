
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🤖 Checking IRON user...')

    let iron = await prisma.user.findFirst({
        where: { username: 'iron' }
    })

    if (!iron) {
        console.log('⚠️ IRON user not found. Creating...')
        iron = await prisma.user.create({
            data: {
                email: "iron@feedgym.bot",
                username: "iron",
                displayName: "IRON",
                bio: "Tu coach virtual. Sin excusas. Solo resultados.",
                avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=IRON&backgroundColor=000000", // Fallback avatar
                goal: "MAINTAIN",
                onboardingCompleted: true,
                // Default targets
                caloriesTarget: 2500,
                proteinTarget: 200,
                carbsTarget: 200,
                fatsTarget: 80
            }
        })
        console.log('✅ IRON user created!')
    } else {
        console.log('✅ IRON user exists.')
        if (!iron.avatarUrl) {
            console.log('⚠️ IRON missing avatar. Updating...')
            await prisma.user.update({
                where: { id: iron.id },
                data: { avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=IRON&backgroundColor=000000" }
            })
            console.log('✅ IRON avatar updated.')
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
