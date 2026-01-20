
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
                avatarUrl: "https://cdn.discordapp.com/attachments/1121155418039791686/1462512040882212875/7c041661d2a1c8e3a88088c56c09ae64.webp?ex=696fc77a&is=696e75fa&hm=a016741b61e0bd2b18f4f5fbd31639338f2a661c03c7a8ccba57475070ecef97&", // Custom IRON avatar
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
