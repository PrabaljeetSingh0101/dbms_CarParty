import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT Customer_ID, Name, Contact_No, City, Is_Active FROM CUSTOMER ORDER BY Customer_ID'
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Customers fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
