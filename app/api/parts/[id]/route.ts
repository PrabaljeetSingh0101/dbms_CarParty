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
    const { Catalog_ID, Garage_ID, Condition, Price, Status } = body

    const fields: string[] = []
    const values: (string | number)[] = []

    if (Catalog_ID !== undefined) {
      fields.push('Catalog_ID = ?')
      values.push(Catalog_ID)
    }
    if (Garage_ID !== undefined) {
      fields.push('Garage_ID = ?')
      values.push(Garage_ID)
    }
    if (Condition !== undefined) {
      fields.push('`Condition` = ?')
      values.push(Condition)
    }
    if (Price !== undefined) {
      fields.push('Price = ?')
      values.push(Price)
    }
    if (Status !== undefined) {
      fields.push('Status = ?')
      values.push(Status)
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(parseInt(id))

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE PART_ITEM SET ${fields.join(', ')} WHERE Item_ID = ?`,
      values
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
