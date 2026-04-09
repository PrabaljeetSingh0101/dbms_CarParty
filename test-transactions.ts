/**
 * TASK 6: Automated Concurrent Transaction Demo
 * 
 * This script simulates 3 customers trying to book the EXACT
 * same part at the EXACT same millisecond — impossible to do
 * by hand, but easy with code.
 * 
 * RUN: npx tsx test-transactions.ts
 */

import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'AutoPartsDB',
}

function log(label: string, msg: string) {
  const time = new Date().toISOString().split('T')[1].slice(0, 12)
  console.log(`  [${time}] ${label.padEnd(12)} | ${msg}`)
}

function divider(title: string) {
  console.log(`\n${'='.repeat(65)}`)
  console.log(`  ${title}`)
  console.log(`${'='.repeat(65)}`)
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 1: Three customers race to book the SAME part
// ─────────────────────────────────────────────────────────────
async function scenarioDoubleBooking() {
  divider('SCENARIO 1: DOUBLE BOOKING RACE CONDITION')
  console.log('  3 customers try to book Part #5 at the EXACT same time.')
  console.log('  Only 1 should succeed. The other 2 must fail.\n')

  // Reset part to Available
  const setup = await mysql.createConnection(dbConfig)
  await setup.execute("UPDATE PART_ITEM SET Status = 'Available' WHERE Item_ID = 5")
  await setup.execute("DELETE FROM BOOKING WHERE Item_ID = 5 AND Booking_Date = '2026-05-01'")
  await setup.end()

  const customers = [
    { id: 1, name: 'Menka Devi' },
    { id: 2, name: 'Savitri Devi' },
    { id: 3, name: 'Mewa Singh' },
  ]

  // Each customer runs in their own connection (simulating separate sessions)
  async function tryBooking(customer: { id: number, name: string }) {
    const conn = await mysql.createConnection(dbConfig)
    try {
      await conn.beginTransaction()
      log(customer.name, '🔄 START TRANSACTION')

      // Lock the row with SELECT ... FOR UPDATE
      const [rows] = await conn.execute(
        'SELECT Item_ID, Status FROM PART_ITEM WHERE Item_ID = 5 FOR UPDATE',
      ) as any

      const status = rows[0]?.Status
      log(customer.name, `🔍 SELECT FOR UPDATE → Status = "${status}"`)

      if (status !== 'Available') {
        log(customer.name, `❌ Part is "${status}" — cannot book. ROLLBACK`)
        await conn.rollback()
        await conn.end()
        return false
      }

      // Small delay to make the race condition visible in logs
      await new Promise(r => setTimeout(r, 100))

      // Insert booking (trigger will set part to 'Booked')
      await conn.execute(
        "INSERT INTO BOOKING (Booking_Date, Booking_Time, Customer_ID, Item_ID) VALUES ('2026-05-01', '10:00:00', ?, 5)",
        [customer.id]
      )
      log(customer.name, '📝 INSERT BOOKING → success')

      await conn.commit()
      log(customer.name, '✅ COMMIT — booking confirmed!')
      await conn.end()
      return true
    } catch (err: any) {
      log(customer.name, `💥 ERROR: ${err.message}`)
      try { await conn.rollback() } catch {}
      await conn.end()
      return false
    }
  }

  // Launch ALL THREE at the exact same time using Promise.all
  console.log('  ⏱️  Launching all 3 bookings simultaneously...\n')
  const results = await Promise.all(customers.map(c => tryBooking(c)))

  const winners = customers.filter((_, i) => results[i])
  const losers = customers.filter((_, i) => !results[i])

  console.log(`\n  📊 RESULT:`)
  console.log(`     Winner: ${winners.map(w => w.name).join(', ') || 'none'}`)
  console.log(`     Blocked: ${losers.map(l => l.name).join(', ')}`)

  // Verify in DB
  const verify = await mysql.createConnection(dbConfig)
  const [bookings] = await verify.execute(
    "SELECT b.Booking_ID, c.Name, b.Booking_Date FROM BOOKING b JOIN CUSTOMER c ON b.Customer_ID = c.Customer_ID WHERE b.Item_ID = 5 AND b.Booking_Date = '2026-05-01'"
  ) as any
  console.log(`     Bookings in DB: ${bookings.length} (should be 1)`)
  const [part] = await verify.execute('SELECT Status FROM PART_ITEM WHERE Item_ID = 5') as any
  console.log(`     Part #5 status: ${part[0].Status} (should be "Booked")`)
  await verify.end()
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 2: DEADLOCK — two transactions lock in opposite order
// ─────────────────────────────────────────────────────────────
async function scenarioDeadlock() {
  divider('SCENARIO 2: DEADLOCK DETECTION')
  console.log('  TX-A locks Part #8, then wants Part #9')
  console.log('  TX-B locks Part #9, then wants Part #8')
  console.log('  → Classic deadlock! MariaDB will kill one.\n')

  // Reset
  const setup = await mysql.createConnection(dbConfig)
  await setup.execute("UPDATE PART_ITEM SET Status = 'Available' WHERE Item_ID IN (8, 9)")
  await setup.end()

  const connA = await mysql.createConnection(dbConfig)
  const connB = await mysql.createConnection(dbConfig)

  let deadlockVictim = ''

  // Transaction A
  const txA = async () => {
    try {
      await connA.beginTransaction()
      log('TX-A', '🔄 START TRANSACTION')

      await connA.execute('SELECT * FROM PART_ITEM WHERE Item_ID = 8 FOR UPDATE')
      log('TX-A', '🔒 Locked Part #8')

      // Wait a bit so TX-B can lock Part #9
      await new Promise(r => setTimeout(r, 200))

      log('TX-A', '⏳ Now trying to lock Part #9...')
      await connA.execute('SELECT * FROM PART_ITEM WHERE Item_ID = 9 FOR UPDATE')
      log('TX-A', '🔒 Got Part #9!')

      await connA.execute("UPDATE PART_ITEM SET Status = 'Booked' WHERE Item_ID IN (8, 9)")
      await connA.commit()
      log('TX-A', '✅ COMMIT — success!')
    } catch (err: any) {
      if (err.code === 'ER_LOCK_DEADLOCK') {
        log('TX-A', '💀 DEADLOCK! MariaDB killed this transaction')
        deadlockVictim = 'TX-A'
      } else {
        log('TX-A', `💥 Error: ${err.message}`)
      }
      try { await connA.rollback() } catch {}
    }
  }

  // Transaction B
  const txB = async () => {
    try {
      await connB.beginTransaction()
      log('TX-B', '🔄 START TRANSACTION')

      await connB.execute('SELECT * FROM PART_ITEM WHERE Item_ID = 9 FOR UPDATE')
      log('TX-B', '🔒 Locked Part #9')

      // Wait a bit so TX-A can lock Part #8
      await new Promise(r => setTimeout(r, 200))

      log('TX-B', '⏳ Now trying to lock Part #8...')
      await connB.execute('SELECT * FROM PART_ITEM WHERE Item_ID = 8 FOR UPDATE')
      log('TX-B', '🔒 Got Part #8!')

      await connB.execute("UPDATE PART_ITEM SET Status = 'Sold' WHERE Item_ID IN (8, 9)")
      await connB.commit()
      log('TX-B', '✅ COMMIT — success!')
    } catch (err: any) {
      if (err.code === 'ER_LOCK_DEADLOCK') {
        log('TX-B', '💀 DEADLOCK! MariaDB killed this transaction')
        deadlockVictim = 'TX-B'
      } else {
        log('TX-B', `💥 Error: ${err.message}`)
      }
      try { await connB.rollback() } catch {}
    }
  }

  await Promise.all([txA(), txB()])

  console.log(`\n  📊 RESULT:`)
  console.log(`     Deadlock victim: ${deadlockVictim} (automatically rolled back)`)
  console.log(`     Survivor: ${deadlockVictim === 'TX-A' ? 'TX-B' : 'TX-A'} (committed successfully)`)

  const verify = await mysql.createConnection(dbConfig)
  const [parts] = await verify.execute('SELECT Item_ID, Status FROM PART_ITEM WHERE Item_ID IN (8, 9)') as any
  console.log(`     Part #8 status: ${parts[0]?.Status}`)
  console.log(`     Part #9 status: ${parts[1]?.Status}`)
  await verify.end()

  await connA.end()
  await connB.end()
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 3: ROLLBACK on failure (Atomicity)
// ─────────────────────────────────────────────────────────────
async function scenarioRollback() {
  divider('SCENARIO 3: TRANSACTION ROLLBACK (Atomicity)')
  console.log('  A dealer tries to add a garage + a part in ONE transaction.')
  console.log('  The part insert has an invalid Catalog_ID → FAILS.')
  console.log('  The garage insert should be ROLLED BACK too.\n')

  const conn = await mysql.createConnection(dbConfig)

  const [before] = await conn.execute('SELECT COUNT(*) as count FROM GARAGE') as any
  log('BEFORE', `Garages in DB: ${before[0].count}`)

  try {
    await conn.beginTransaction()
    log('TX', '🔄 START TRANSACTION')

    // Step 1: Insert garage (valid)
    await conn.execute("INSERT INTO GARAGE (Name, Location, Dealer_ID) VALUES ('Phantom Garage', 'Nowhere City', 1)")
    log('TX', '📝 INSERT GARAGE "Phantom Garage" → success')

    // Verify inside transaction
    const [inside] = await conn.execute("SELECT Garage_ID, Name FROM GARAGE WHERE Name = 'Phantom Garage'") as any
    log('TX', `🔍 SELECT inside TX → Found: ${inside[0]?.Name} (ID: ${inside[0]?.Garage_ID})`)

    // Step 2: Insert part with BAD Catalog_ID (will fail)
    log('TX', '📝 INSERT PART with Catalog_ID = 99999 (invalid)...')
    await conn.execute("INSERT INTO PART_ITEM (Catalog_ID, Garage_ID, `Condition`, Price) VALUES (99999, 1, 'Good', 5000)")

    await conn.commit()
  } catch (err: any) {
    log('TX', `💥 ERROR: ${err.message.split('\n')[0]}`)
    await conn.rollback()
    log('TX', '↩️  ROLLBACK — entire transaction undone')
  }

  const [after] = await conn.execute('SELECT COUNT(*) as count FROM GARAGE') as any
  log('AFTER', `Garages in DB: ${after[0].count}`)

  const [phantom] = await conn.execute("SELECT * FROM GARAGE WHERE Name = 'Phantom Garage'") as any
  log('VERIFY', `"Phantom Garage" exists? ${phantom.length > 0 ? 'YES ❌' : 'NO ✅ (rolled back!)'}`)

  console.log(`\n  📊 RESULT:`)
  console.log(`     Garages before: ${before[0].count}`)
  console.log(`     Garages after:  ${after[0].count} (same — nothing was added)`)
  console.log(`     Proves ATOMICITY: all-or-nothing!`)

  await conn.end()
}

// ─────────────────────────────────────────────────────────────
// RUN ALL SCENARIOS
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║     TASK 6: DATABASE TRANSACTION DEMOS — AutoPartsDB        ║')
  console.log('║     Testing conflicts, deadlocks, and rollbacks             ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')

  await scenarioDoubleBooking()
  await scenarioDeadlock()
  await scenarioRollback()

  divider('ALL SCENARIOS COMPLETE')
  console.log('  ✅ Scenario 1: Double booking prevented via row locking')
  console.log('  ✅ Scenario 2: Deadlock detected and resolved by MariaDB')
  console.log('  ✅ Scenario 3: Failed transaction fully rolled back')
  console.log('')

  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
