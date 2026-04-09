import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const condition = searchParams.get('condition')
    const search = searchParams.get('search')

    let query = `
      SELECT 
        pi.Item_ID, pi.Catalog_ID, pi.Garage_ID, pi.\`Condition\`, pi.Price, pi.Status,
        pc.Category, pc.Brand, pc.Model,
        g.Name AS Garage_Name, g.Location AS Garage_Location, g.Dealer_ID,
        sd.Name AS Dealer_Name, sd.Contact_No AS Dealer_Contact, sd.Location AS Dealer_Location
      FROM PART_ITEM pi
      JOIN PART_CATALOG pc ON pi.Catalog_ID = pc.Catalog_ID
      JOIN GARAGE g ON pi.Garage_ID = g.Garage_ID
      JOIN SCRAP_DEALER sd ON g.Dealer_ID = sd.Dealer_ID
      WHERE 1=1
    `
    const params: string[] = []

    if (status) {
      query += ' AND pi.Status = ?'
      params.push(status)
    }
    if (category && category !== 'all') {
      query += ' AND pc.Category = ?'
      params.push(category)
    }
    if (brand && brand !== 'all') {
      query += ' AND pc.Brand = ?'
      params.push(brand)
    }
    if (condition && condition !== 'all') {
      query += ' AND pi.`Condition` = ?'
      params.push(condition)
    }
    if (search) {
      query += ' AND (pc.Category LIKE ? OR pc.Brand LIKE ? OR pc.Model LIKE ?)'
      const like = `%${search}%`
      params.push(like, like, like)
    }

    query += ' ORDER BY pi.Item_ID'

    const [rows] = await pool.query<RowDataPacket[]>(query, params)

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
        Dealer_ID: row.Dealer_ID,
      },
      dealer: {
        Dealer_ID: row.Dealer_ID,
        Name: row.Dealer_Name,
        Contact_No: row.Dealer_Contact,
        Location: row.Dealer_Location,
      },
    }))

    return NextResponse.json(parts)
  } catch (error) {
    console.error('Parts fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
