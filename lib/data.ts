// Type interfaces matching the database schema

export interface ScrapDealer {
  Dealer_ID: number
  Name: string
  Contact_No: string
  Location: string
  Is_Active: boolean
}

export interface Garage {
  Garage_ID: number
  Name: string
  Location: string
  Dealer_ID: number
}

export interface PartCatalog {
  Catalog_ID: number
  Category: string
  Brand: string
  Model: string
}

export interface PartItem {
  Item_ID: number
  Catalog_ID: number
  Garage_ID: number
  Condition: string
  Price: number
  Status: 'Available' | 'Booked' | 'Sold'
}

export interface Customer {
  Customer_ID: number
  Name: string
  Contact_No: string
  City: string
  Is_Active: boolean
}

export interface Booking {
  Booking_ID: number
  Booking_Date: string
  Booking_Time: string
  Booking_Status: 'Completed' | 'Cancelled' | 'No-Show' | 'Pending'
  Customer_ID: number
  Item_ID: number
}

export interface Wishlist {
  Wishlist_ID: number
  Customer_ID: number
  Catalog_ID: number
  Notified: boolean
  Created_At: string
}

// Helper functions
export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}
