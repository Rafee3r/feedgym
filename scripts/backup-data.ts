
import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

async function main() {
    console.log("📦 Starting backup...")
    try {
        const users = await prisma.user.findMany({ include: { posts: true, followedBy: true, following: true } })
        const posts = await prisma.post.findMany()

        const backup = {
            timestamp: new Date().toISOString(),
            users,
            posts,
        }

        const backupDir = path.join(process.cwd(), "backups")
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir)
        }

        const filename = `backup-${new Date().toISOString().replace(/:/g, "-").split(".")[0]}.json`
        const filepath = path.join(backupDir, filename)

        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2))
        console.log(`✅ Backup saved to ${filepath}`)
    } catch (e) {
        console.error("❌ Backup failed:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
