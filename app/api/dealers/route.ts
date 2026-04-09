import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT Dealer_ID, Name, Contact_No, Location, Is_Active FROM SCRAP_DEALER ORDER BY Dealer_ID'
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Dealers fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
