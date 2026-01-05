import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const username = process.argv[2]
    if (!username) {
        console.error("Por favor proporciona un nombre de usuario.")
        process.exit(1)
    }

    try {
        const user = await prisma.user.update({
            where: { username: username.toLowerCase() },
            data: { role: "ADMIN" },
        })
        console.log(`✅ Usuario @${user.username} ahora es ADMIN.`)
    } catch (error) {
        console.error("Error al actualizar usuario:", error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
