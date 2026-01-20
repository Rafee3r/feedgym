
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🛒 Testing Shopping List Persistence...')

    const user = await prisma.user.findFirst()
    if (!user) { console.error('No user found'); return }

    // 1. Create list if not exists (backend logic simulation)
    let list = await prisma.shoppingList.findUnique({ where: { userId: user.id } })
    if (!list) {
        list = await prisma.shoppingList.create({ data: { userId: user.id } })
        console.log('✅ Created new Shopping List')
    }

    // 2. Add Item
    const item = await prisma.shoppingItem.create({
        data: {
            shoppingListId: list.id,
            name: "Test Item " + Date.now(),
            quantity: "1 kg",
            category: "Test"
        }
    })
    console.log(`✅ Item added: ${item.name}`)

    // 3. Toggle Check
    const updated = await prisma.shoppingItem.update({
        where: { id: item.id },
        data: { checked: true }
    })
    console.log(`✅ Item checked status: ${updated.checked}`)

    console.log('🛒 Shopping List Test Passed!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
