import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection()
  try {
    const { id } = await params
    const body = await req.json()
    const { Booking_Status } = body

    if (!Booking_Status || !['Completed', 'Cancelled', 'No-Show'].includes(Booking_Status)) {
      connection.release()
      return NextResponse.json(
        { error: 'Valid Booking_Status is required (Completed, Cancelled, No-Show)' },
        { status: 400 }
      )
    }

    // ── TRANSACTION START ──
    await connection.beginTransaction()

    // Step 1: Lock the booking row first
    const [bookingRows] = await connection.query<RowDataPacket[]>(
      'SELECT Booking_ID, Booking_Status, Item_ID FROM BOOKING WHERE Booking_ID = ? FOR UPDATE',
      [parseInt(id)]
    )

    if (bookingRows.length === 0) {
      await connection.rollback()
      connection.release()
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Step 2: Also lock the part row (trigger will update it)
    await connection.query<RowDataPacket[]>(
      'SELECT Item_ID FROM PART_ITEM WHERE Item_ID = ? FOR UPDATE',
      [bookingRows[0].Item_ID]
    )

    // Step 3: Update booking status (trigger Update_Part_On_Booking_Status fires)
    await connection.query<ResultSetHeader>(
      'UPDATE BOOKING SET Booking_Status = ? WHERE Booking_ID = ?',
      [Booking_Status, parseInt(id)]
    )

    // Step 4: Commit both the booking update + part status change atomically
    await connection.commit()
    // ── TRANSACTION END ──

    connection.release()
    return NextResponse.json({ success: true })
  } catch (error) {
    await connection.rollback()
    connection.release()
    console.error('Update booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
