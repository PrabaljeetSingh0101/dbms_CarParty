import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dealerId = searchParams.get('dealer_id')

    let query = 'SELECT Garage_ID, Name, Location, Dealer_ID FROM GARAGE'
    const params: string[] = []

    if (dealerId) {
      query += ' WHERE Dealer_ID = ?'
      params.push(dealerId)
    }

    query += ' ORDER BY Garage_ID'

    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Garages fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
