import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dealerId = searchParams.get('dealer_id')

    if (!dealerId) {
      return NextResponse.json({ error: 'dealer_id is required' }, { status: 400 })
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pi.Item_ID, pi.Catalog_ID, pi.Garage_ID, pi.\`Condition\`, pi.Price, pi.Status,
        pc.Category, pc.Brand, pc.Model,
        g.Name AS Garage_Name, g.Location AS Garage_Location
      FROM PART_ITEM pi
      JOIN PART_CATALOG pc ON pi.Catalog_ID = pc.Catalog_ID
      JOIN GARAGE g ON pi.Garage_ID = g.Garage_ID
      WHERE g.Dealer_ID = ?
      ORDER BY pi.Item_ID`,
      [dealerId]
    )

    const parts = rows.map(row => ({
      Item_ID: row.Item_ID,
      Catalog_ID: row.Catalog_ID,
      Garage_ID: row.Garage_ID,
      Condition: row.Condition,
      Price: parseFloat(row.Price),
      Status: row.Status,
      catalog: {
        Catalog_ID: row.Catalog_ID,
        Category: row.Category,
        Brand: row.Brand,
        Model: row.Model,
      },
      garage: {
        Garage_ID: row.Garage_ID,
        Name: row.Garage_Name,
        Location: row.Garage_Location,
      },
    }))

    return NextResponse.json(parts)
  } catch (error) {
    console.error('Dealer parts fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { Catalog_ID, Garage_ID, Condition, Price } = body

    if (!Catalog_ID || !Garage_ID || !Condition || !Price) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO PART_ITEM (Catalog_ID, Garage_ID, `Condition`, Price, Status) VALUES (?, ?, ?, ?, ?)',
      [Catalog_ID, Garage_ID, Condition, Price, 'Available']
    )

    return NextResponse.json({ success: true, Item_ID: result.insertId })
  } catch (error) {
    console.error('Add part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
