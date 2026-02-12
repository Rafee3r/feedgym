import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function debugData() {
    console.log("=".repeat(50))
    console.log("DEBUG: Checking data in database")
    console.log("=".repeat(50))

    // Check users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            trainingDays: true,
            goal: true,
            targetWeight: true,
        }
    })
    console.log("\n📊 USERS:")
    users.forEach(u => {
        console.log(`  - ${u.username} (${u.id.substring(0, 8)}...)`)
        console.log(`    trainingDays: ${JSON.stringify(u.trainingDays)}`)
        console.log(`    goal: ${u.goal}, targetWeight: ${u.targetWeight}`)
    })

    // Check weight logs
    const weightLogs = await prisma.weightLog.findMany({
        include: { user: { select: { username: true } } },
        take: 10,
        orderBy: { loggedAt: "desc" }
    })
    console.log("\n⚖️ WEIGHT LOGS (last 10):")
    if (weightLogs.length === 0) {
        console.log("  ❌ No weight logs found!")
    } else {
        weightLogs.forEach(w => {
            console.log(`  - ${w.user.username}: ${w.weight}kg on ${w.loggedAt.toISOString().split('T')[0]}`)
        })
    }

    // Check coach messages
    const messages = await prisma.coachMessage.count()
    console.log(`\n💬 COACH MESSAGES: ${messages} total`)

    // Count by user
    const msgByUser = await prisma.coachMessage.groupBy({
        by: ["userId"],
        _count: true,
    })
    for (const m of msgByUser) {
        const user = await prisma.user.findUnique({ where: { id: m.userId }, select: { username: true } })
        console.log(`  - ${user?.username || m.userId}: ${m._count} messages`)
    }

    await prisma.$disconnect()
}

debugData().catch(console.error)
