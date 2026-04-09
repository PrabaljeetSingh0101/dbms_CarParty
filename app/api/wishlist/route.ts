import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customer_id')

    if (!customerId) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        w.Wishlist_ID, w.Customer_ID, w.Catalog_ID, w.Notified, w.Created_At,
        pc.Category, pc.Brand, pc.Model
      FROM WISHLIST w
      JOIN PART_CATALOG pc ON w.Catalog_ID = pc.Catalog_ID
      WHERE w.Customer_ID = ?
      ORDER BY w.Created_At DESC`,
      [customerId]
    )

    // For each wishlist item, get available count and lowest price
    const wishlistItems = await Promise.all(
      rows.map(async (row) => {
        const [availRows] = await pool.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS count, MIN(Price) AS minPrice 
           FROM PART_ITEM 
           WHERE Catalog_ID = ? AND Status = 'Available'`,
          [row.Catalog_ID]
        )
        return {
          Wishlist_ID: row.Wishlist_ID,
          Customer_ID: row.Customer_ID,
          Catalog_ID: row.Catalog_ID,
          Notified: Boolean(row.Notified),
          Created_At: row.Created_At,
          catalog: {
            Catalog_ID: row.Catalog_ID,
            Category: row.Category,
            Brand: row.Brand,
            Model: row.Model,
          },
          availableCount: availRows[0].count,
          lowestPrice: availRows[0].minPrice ? parseFloat(availRows[0].minPrice) : null,
        }
      })
    )

    return NextResponse.json(wishlistItems)
  } catch (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { Customer_ID, Catalog_ID } = body

    if (!Customer_ID || !Catalog_ID) {
      return NextResponse.json({ error: 'Customer_ID and Catalog_ID are required' }, { status: 400 })
    }

    // Check if already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT Wishlist_ID FROM WISHLIST WHERE Customer_ID = ? AND Catalog_ID = ?',
      [Customer_ID, Catalog_ID]
    )

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already in wishlist' }, { status: 409 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO WISHLIST (Customer_ID, Catalog_ID) VALUES (?, ?)',
      [Customer_ID, Catalog_ID]
    )

    return NextResponse.json({ success: true, Wishlist_ID: result.insertId })
  } catch (error) {
    console.error('Add wishlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const wishlistId = searchParams.get('wishlist_id')

    if (!wishlistId) {
      return NextResponse.json({ error: 'wishlist_id is required' }, { status: 400 })
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM WISHLIST WHERE Wishlist_ID = ?',
      [parseInt(wishlistId)]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete wishlist error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
