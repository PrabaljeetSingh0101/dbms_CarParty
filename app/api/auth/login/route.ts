import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Check if customer
    const [customers] = await pool.query<RowDataPacket[]>(
      'SELECT Customer_ID, Name FROM CUSTOMER WHERE LOWER(Name) = LOWER(?) AND Is_Active = TRUE',
      [trimmedName]
    )

    if (customers.length > 0) {
      return NextResponse.json({
        success: true,
        type: 'customer',
        id: customers[0].Customer_ID,
        name: customers[0].Name,
      })
    }

    // Check if dealer
    const [dealers] = await pool.query<RowDataPacket[]>(
      'SELECT Dealer_ID, Name FROM SCRAP_DEALER WHERE LOWER(Name) = LOWER(?) AND Is_Active = TRUE',
      [trimmedName]
    )

    if (dealers.length > 0) {
      return NextResponse.json({
        success: true,
        type: 'dealer',
        id: dealers[0].Dealer_ID,
        name: dealers[0].Name,
      })
    }

    return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 404 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
