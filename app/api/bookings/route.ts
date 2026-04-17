import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customer_id')
    const dealerId = searchParams.get('dealer_id')

    let query = `
      SELECT 
        b.Booking_ID, b.Booking_Date, b.Booking_Time, b.Booking_Status,
        b.Customer_ID, b.Item_ID,
        pi.Catalog_ID, pi.Garage_ID, pi.\`Condition\`, pi.Price, pi.Status AS Item_Status,
        pc.Category, pc.Brand, pc.Model,
        g.Name AS Garage_Name, g.Location AS Garage_Location, g.Dealer_ID,
        sd.Name AS Dealer_Name, sd.Contact_No AS Dealer_Contact, sd.Location AS Dealer_Location,
        c.Name AS Customer_Name, c.Contact_No AS Customer_Contact, c.City AS Customer_City
      FROM BOOKING b
      JOIN PART_ITEM pi ON b.Item_ID = pi.Item_ID
      JOIN PART_CATALOG pc ON pi.Catalog_ID = pc.Catalog_ID
      JOIN GARAGE g ON pi.Garage_ID = g.Garage_ID
      JOIN SCRAP_DEALER sd ON g.Dealer_ID = sd.Dealer_ID
      JOIN CUSTOMER c ON b.Customer_ID = c.Customer_ID
      WHERE 1=1
    `
    const params: string[] = []

    if (customerId) {
      query += ' AND b.Customer_ID = ?'
      params.push(customerId)
    }

    if (dealerId) {
      query += ' AND g.Dealer_ID = ?'
      params.push(dealerId)
    }

    query += ' ORDER BY b.Booking_Date DESC, b.Booking_Time DESC'

    const [rows] = await pool.query<RowDataPacket[]>(query, params)

    const bookings = rows.map(row => ({
      Booking_ID: row.Booking_ID,
      Booking_Date: row.Booking_Date,
      Booking_Time: row.Booking_Time,
      Booking_Status: row.Booking_Status || 'Pending',
      Customer_ID: row.Customer_ID,
      Item_ID: row.Item_ID,
      item: {
        Item_ID: row.Item_ID,
        Catalog_ID: row.Catalog_ID,
        Garage_ID: row.Garage_ID,
        Condition: row.Condition,
        Price: parseFloat(row.Price),
        Status: row.Item_Status,
      },
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
      customer: {
        Customer_ID: row.Customer_ID,
        Name: row.Customer_Name,
        Contact_No: row.Customer_Contact,
        City: row.Customer_City,
      },
    }))

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Bookings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { Customer_ID, Item_ID, Booking_Date, Booking_Time } = body

  if (!Customer_ID || !Item_ID || !Booking_Date || !Booking_Time) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    // ── TRANSACTION START ──
    await connection.beginTransaction()

    // Step 1: Lock the part row so no other transaction can touch it
    const [partRows] = await connection.query<RowDataPacket[]>(
      'SELECT Item_ID, Status FROM PART_ITEM WHERE Item_ID = ? FOR UPDATE',
      [Item_ID]
    )

    // Step 2: Check if part is still available
    if (partRows.length === 0) {
      await connection.rollback()
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    if (partRows[0].Status !== 'Available') {
      await connection.rollback()
      return NextResponse.json(
        { error: `Part is already ${partRows[0].Status}. Cannot book.` },
        { status: 409 }
      )
    }

    // Step 3: Insert the booking (trigger Auto_Book_Part_Item sets part to 'Booked')
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO BOOKING (Booking_Date, Booking_Time, Customer_ID, Item_ID) VALUES (?, ?, ?, ?)',
      [Booking_Date, Booking_Time, Customer_ID, Item_ID]
    )

    // Step 4: Commit — all changes are saved atomically
    await connection.commit()
    // ── TRANSACTION END ──

    return NextResponse.json({ success: true, Booking_ID: result.insertId })
  } catch (error: any) {
    // If ANYTHING fails, rollback ALL changes
    await connection.rollback()
    console.error('Create booking error:', error)
    
    // Check if the error is a foreign key constraint failure (e.g., Customer doesn't exist)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json({ error: 'Invalid Customer ID or Item ID provided' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    // Guarantee that connection is returned to the pool
    connection.release()
  }
}
