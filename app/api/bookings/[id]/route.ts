import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { ResultSetHeader } from 'mysql2'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { Booking_Status } = body

    if (!Booking_Status || !['Completed', 'Cancelled', 'No-Show'].includes(Booking_Status)) {
      return NextResponse.json(
        { error: 'Valid Booking_Status is required (Completed, Cancelled, No-Show)' },
        { status: 400 }
      )
    }

    // The DB trigger Update_Part_On_Booking_Status will automatically update part status
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE BOOKING SET Booking_Status = ? WHERE Booking_ID = ?',
      [Booking_Status, parseInt(id)]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
