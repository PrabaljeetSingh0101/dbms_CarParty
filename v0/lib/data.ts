// Mock data matching your database schema

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

export interface Notification {
  Notification_ID: number
  From_Garage_ID: number
  To_Customer_ID: number
  Message: string
  Created_At: string
  Is_Read: boolean
}

// Sample Data from your SQL
export const scrapDealers: ScrapDealer[] = [
  { Dealer_ID: 1, Name: 'Ramachandra', Contact_No: '9876543210', Location: 'Delhi', Is_Active: true },
  { Dealer_ID: 2, Name: 'Mohandas', Contact_No: '9123456780', Location: 'Mumbai', Is_Active: true },
  { Dealer_ID: 3, Name: 'Bhaskar', Contact_No: '9988776655', Location: 'Jaipur', Is_Active: true },
  { Dealer_ID: 4, Name: 'Jagdish', Contact_No: '9011223344', Location: 'Ahmedabad', Is_Active: false },
]

export const garages: Garage[] = [
  { Garage_ID: 1, Name: 'Ramachandra Garage East', Location: 'East Delhi', Dealer_ID: 1 },
  { Garage_ID: 2, Name: 'Ramachandra Garage West', Location: 'West Delhi', Dealer_ID: 1 },
  { Garage_ID: 3, Name: 'Mohandas Workshop', Location: 'Andheri', Dealer_ID: 2 },
  { Garage_ID: 4, Name: 'Bhaskar Yard', Location: 'Jaipur South', Dealer_ID: 3 },
  { Garage_ID: 5, Name: 'Jagdish Depot', Location: 'SG Highway', Dealer_ID: 4 },
]

export const initialPartCatalogs: PartCatalog[] = [
  { Catalog_ID: 1, Category: 'Engine', Brand: 'Maruti', Model: 'Maruti 800' },
  { Catalog_ID: 2, Category: 'Headlight', Brand: 'Maruti', Model: 'Swift' },
  { Catalog_ID: 3, Category: 'Bumper', Brand: 'Maruti', Model: 'Zen' },
  { Catalog_ID: 4, Category: 'Door Panel', Brand: 'Maruti', Model: 'Gypsy' },
  { Catalog_ID: 5, Category: 'Transmission', Brand: 'Maruti', Model: 'Ritz' },
  { Catalog_ID: 6, Category: 'Radiator', Brand: 'Hindustan', Model: 'Ambassador' },
  { Catalog_ID: 7, Category: 'Alloy Wheel', Brand: 'Tata', Model: 'Indica' },
]

export const initialPartItems: PartItem[] = [
  { Item_ID: 1, Catalog_ID: 1, Garage_ID: 1, Condition: 'Good', Price: 45000.00, Status: 'Available' },
  { Item_ID: 2, Catalog_ID: 2, Garage_ID: 1, Condition: 'Fair', Price: 3500.00, Status: 'Sold' },
  { Item_ID: 3, Catalog_ID: 3, Garage_ID: 2, Condition: 'Good', Price: 8000.00, Status: 'Available' },
  { Item_ID: 4, Catalog_ID: 4, Garage_ID: 3, Condition: 'Damaged', Price: 12000.00, Status: 'Sold' },
  { Item_ID: 5, Catalog_ID: 5, Garage_ID: 3, Condition: 'Fair', Price: 22000.00, Status: 'Available' },
  { Item_ID: 6, Catalog_ID: 1, Garage_ID: 4, Condition: 'Good', Price: 48000.00, Status: 'Available' },
  { Item_ID: 7, Catalog_ID: 6, Garage_ID: 4, Condition: 'Damaged', Price: 4500.00, Status: 'Sold' },
  { Item_ID: 8, Catalog_ID: 7, Garage_ID: 5, Condition: 'Good', Price: 9500.00, Status: 'Available' },
  { Item_ID: 9, Catalog_ID: 2, Garage_ID: 2, Condition: 'Good', Price: 4000.00, Status: 'Available' },
  { Item_ID: 10, Catalog_ID: 3, Garage_ID: 1, Condition: 'Fair', Price: 6500.00, Status: 'Sold' },
]

export const customers: Customer[] = [
  { Customer_ID: 1, Name: 'Menka Devi', Contact_No: '8001234567', City: 'Delhi', Is_Active: true },
  { Customer_ID: 2, Name: 'Savitri Devi', Contact_No: '8009876543', City: 'Mumbai', Is_Active: true },
  { Customer_ID: 3, Name: 'Mewa Singh', Contact_No: '8005556677', City: 'Jaipur', Is_Active: true },
  { Customer_ID: 4, Name: 'Meera Bai', Contact_No: '8003334455', City: 'Ahmedabad', Is_Active: true },
  { Customer_ID: 5, Name: 'Dharamveer Singh', Contact_No: '8007778899', City: 'Delhi', Is_Active: false },
]

export const initialBookings: Booking[] = [
  { Booking_ID: 1, Booking_Date: '2025-03-01', Booking_Time: '10:00:00', Booking_Status: 'Completed', Customer_ID: 1, Item_ID: 2 },
  { Booking_ID: 2, Booking_Date: '2025-03-03', Booking_Time: '14:30:00', Booking_Status: 'Completed', Customer_ID: 2, Item_ID: 4 },
  { Booking_ID: 3, Booking_Date: '2025-03-05', Booking_Time: '11:00:00', Booking_Status: 'Cancelled', Customer_ID: 3, Item_ID: 1 },
  { Booking_ID: 4, Booking_Date: '2025-03-06', Booking_Time: '09:00:00', Booking_Status: 'No-Show', Customer_ID: 4, Item_ID: 8 },
  { Booking_ID: 5, Booking_Date: '2025-03-07', Booking_Time: '16:00:00', Booking_Status: 'Completed', Customer_ID: 1, Item_ID: 10 },
  { Booking_ID: 6, Booking_Date: '2025-03-08', Booking_Time: '12:00:00', Booking_Status: 'Completed', Customer_ID: 5, Item_ID: 7 },
  { Booking_ID: 7, Booking_Date: '2025-03-10', Booking_Time: '10:30:00', Booking_Status: 'Cancelled', Customer_ID: 2, Item_ID: 5 },
]

export const initialWishlist: Wishlist[] = []

export const initialNotifications: Notification[] = []

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
