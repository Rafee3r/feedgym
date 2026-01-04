
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const args = process.argv.slice(2)
    const username = args[0]
    const role = args[1]?.toUpperCase()

    if (!username || !role) {
        console.error("Usage: npx tsx scripts/set-role.ts <username> <USER|ADMIN|STAFF>")
        process.exit(1)
    }

    if (!["USER", "ADMIN", "STAFF"].includes(role)) {
        console.error("Invalid role. Must be one of: USER, ADMIN, STAFF")
        process.exit(1)
    }

    try {
        const user = await prisma.user.update({
            where: { username: username.toLowerCase() },
            data: { role: role as any },
        })
        console.log(`✅ Updated user ${user.username} to role ${user.role}`)
    } catch (e) {
        console.error("❌ Error updating user:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
