import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT Catalog_ID, Category, Brand, Model FROM PART_CATALOG ORDER BY Catalog_ID'
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Catalogs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { Category, Brand, Model } = body

    if (!Category || !Brand || !Model) {
      return NextResponse.json({ error: 'Category, Brand, and Model are required' }, { status: 400 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO PART_CATALOG (Category, Brand, Model) VALUES (?, ?, ?)',
      [Category, Brand, Model]
    )

    return NextResponse.json({ success: true, Catalog_ID: result.insertId })
  } catch (error) {
    console.error('Add catalog error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
