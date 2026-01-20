
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Starting persistence test...')

    // 1. Get a test user (or the first user found)
    const user = await prisma.user.findFirst()
    if (!user) {
        console.error('❌ No users found in DB. Cannot test.')
        return
    }
    console.log(`👤 Testing with user: ${user.username} (${user.id})`)

    // TEST 1: MACRO SETTINGS
    console.log('\n🧪 TEST 1: Saving Macro Targets...')
    try {
        const newTarget = Math.floor(Math.random() * 500) + 1500
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { caloriesTarget: newTarget }
        })

        if (updatedUser.caloriesTarget === newTarget) {
            console.log(`✅ Macros Saved! New Target: ${updatedUser.caloriesTarget}`)
        } else {
            console.error(`❌ Macro save failed. Expected ${newTarget}, got ${updatedUser.caloriesTarget}`)
        }
    } catch (e) {
        console.error('❌ Macro save ERROR:', e)
    }

    // TEST 2: NUTRITION LOG (Manual Entry)
    console.log('\n🧪 TEST 2: Logging Food...')
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Create/Get DailyLog
        let dailyLog = await prisma.dailyLog.findFirst({
            where: { userId: user.id, date: today }
        })
        if (!dailyLog) {
            dailyLog = await prisma.dailyLog.create({
                data: { userId: user.id, date: today }
            })
        }

        // Create/Get Meal
        const mealType = "SNACK"
        let meal = await prisma.meal.findFirst({
            where: { dailyLogId: dailyLog.id, type: mealType }
        })
        if (!meal) {
            meal = await prisma.meal.create({
                data: { dailyLogId: dailyLog.id, type: mealType }
            })
        }

        // Add Entry
        const entry = await prisma.foodEntry.create({
            data: {
                mealId: meal.id,
                name: "Test Food " + Math.random().toString(36).substring(7),
                calories: 100,
                protein: 10,
                carbs: 10,
                fats: 2,
                unit: "serving", // Testing the field causing issues
                portion: 1
            }
        })
        console.log(`✅ Food Entry Saved! ID: ${entry.id}`)
    } catch (e) {
        console.error('❌ Food log ERROR:', e)
    }

    // TEST 3: CHAT HISTORY
    console.log('\n🧪 TEST 3: Saving Chat Message...')
    try {
        const msg = await prisma.coachMessage.create({
            data: {
                userId: user.id,
                role: "user",
                content: "Test message persistence " + new Date().toISOString()
            }
        })
        console.log(`✅ Chat Message Saved! ID: ${msg.id}`)
    } catch (e) {
        console.error('❌ Chat save ERROR:', e)
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
