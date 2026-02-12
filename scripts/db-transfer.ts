/**
 * Database Transfer Script
 * Copies all data from the OLD Supabase database to the NEW one.
 * 
 * Usage: npx tsx scripts/db-transfer.ts
 */

import { PrismaClient } from '@prisma/client'

// --- CONFIGURATION ---
const OLD_DATABASE_URL = "postgres://postgres.yydzmizofieaqvnfpzmd:LEon1971%211234@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
const NEW_DATABASE_URL = "postgresql://postgres.eagvbgoxgdnsdxmpbqhc:rQWpQrGHenPSOkdN@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

// Note: The password brackets [] in the user's input were URL encoding markers, removed here.

const oldPrisma = new PrismaClient({
    datasources: { db: { url: OLD_DATABASE_URL } },
    log: ['error']
})

const newPrisma = new PrismaClient({
    datasources: { db: { url: NEW_DATABASE_URL } },
    log: ['error']
})

// Tables to migrate in dependency order (parents before children)
const TABLES_IN_ORDER = [
    'User',
    'Account',
    'Session',
    'VerificationToken',
    'PasswordResetToken',
    'PushSubscription',
    'Post',
    'Like',
    'Bookmark',
    'Follow',
    'WeightLog',
    'PersonalRecord',
    'Notification',
    'CoachMessage',
    'DailyLog',
    'Meal',
    'FoodEntry',
    'KitchenItem',
    'ShoppingList',
    'ShoppingItem',
]

async function countRecords(prisma: PrismaClient, table: string): Promise<number> {
    try {
        // @ts-ignore - dynamic access
        return await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count()
    } catch {
        return 0
    }
}

async function getAllRecords(prisma: PrismaClient, table: string): Promise<any[]> {
    try {
        // @ts-ignore - dynamic access
        return await prisma[table.charAt(0).toLowerCase() + table.slice(1)].findMany()
    } catch (e) {
        console.error(`Error reading ${table}:`, e)
        return []
    }
}

async function insertRecords(prisma: PrismaClient, table: string, records: any[]): Promise<number> {
    if (records.length === 0) return 0

    let inserted = 0
    for (const record of records) {
        try {
            // @ts-ignore - dynamic access
            await prisma[table.charAt(0).toLowerCase() + table.slice(1)].upsert({
                where: { id: record.id },
                create: record,
                update: record // If exists, update with same data (idempotent)
            })
            inserted++
        } catch (e: any) {
            // Silent fail for this record, continue
            console.error(`Error upserting into ${table}:`, e.message?.substring(0, 100))
        }
    }
    return inserted
}

async function main() {
    console.log('='.repeat(60))
    console.log('DATABASE MIGRATION SCRIPT')
    console.log('='.repeat(60))
    console.log('\n1. Testing connections...')

    try {
        await oldPrisma.$connect()
        console.log('   ✓ Connected to OLD database')
    } catch (e) {
        console.error('   ✗ Failed to connect to OLD database:', e)
        process.exit(1)
    }

    try {
        await newPrisma.$connect()
        console.log('   ✓ Connected to NEW database')
    } catch (e) {
        console.error('   ✗ Failed to connect to NEW database:', e)
        process.exit(1)
    }

    // DISABLE FK CONSTRAINTS on NEW database
    console.log('\n2. Disabling foreign key constraints on NEW database...')
    try {
        await newPrisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`)
        console.log('   ✓ Constraints disabled')
    } catch (e) {
        console.warn('   ⚠ Could not disable constraints (may fail on some inserts):', e)
    }

    console.log('\n3. Checking record counts in OLD database...')
    const counts: Record<string, number> = {}
    for (const table of TABLES_IN_ORDER) {
        counts[table] = await countRecords(oldPrisma, table)
        if (counts[table] > 0) {
            console.log(`   ${table}: ${counts[table]} records`)
        }
    }

    console.log('\n4. Migrating data...')
    const results: Record<string, { total: number, inserted: number }> = {}

    for (const table of TABLES_IN_ORDER) {
        if (counts[table] === 0) continue

        process.stdout.write(`   Migrating ${table}...`)
        const records = await getAllRecords(oldPrisma, table)
        const inserted = await insertRecords(newPrisma, table, records)
        results[table] = { total: records.length, inserted }
        console.log(` ${inserted}/${records.length} inserted`)
    }

    // RE-ENABLE FK CONSTRAINTS
    console.log('\n5. Re-enabling foreign key constraints...')
    try {
        await newPrisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`)
        console.log('   ✓ Constraints re-enabled')
    } catch (e) {
        console.warn('   ⚠ Could not re-enable constraints:', e)
    }

    console.log('\n6. Migration Summary:')
    console.log('-'.repeat(40))
    let totalRecords = 0
    let totalInserted = 0
    for (const [table, { total, inserted }] of Object.entries(results)) {
        console.log(`   ${table}: ${inserted}/${total}`)
        totalRecords += total
        totalInserted += inserted
    }
    console.log('-'.repeat(40))
    console.log(`   TOTAL: ${totalInserted}/${totalRecords} records migrated`)

    if (totalInserted === totalRecords) {
        console.log('\n✓ MIGRATION COMPLETE! All data transferred successfully.')
    } else if (totalInserted > 0) {
        console.log('\n⚠ MIGRATION PARTIAL. Some records may have already existed or failed.')
    } else {
        console.log('\n✗ MIGRATION FAILED. No records were transferred.')
    }

    console.log('\n7. Next steps:')
    console.log('   - Update your .env file with the NEW DATABASE_URL')
    console.log('   - Run `npx prisma generate` to update the client')
    console.log('   - Test your application')
}

main()
    .catch(e => {
        console.error('Fatal error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await oldPrisma.$disconnect()
        await newPrisma.$disconnect()
    })
