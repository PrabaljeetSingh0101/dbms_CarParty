"use client"

import { create } from 'zustand'
import { 
  PartItem, 
  PartCatalog,
  Booking, 
  Wishlist, 
  Notification,
  initialPartItems, 
  initialPartCatalogs,
  initialBookings, 
  initialWishlist,
  initialNotifications,
  customers,
  scrapDealers,
} from './data'

interface User {
  type: 'customer' | 'dealer'
  id: number
  name: string
}

interface AppState {
  // Auth
  user: User | null
  login: (name: string) => { success: boolean; type?: 'customer' | 'dealer'; error?: string }
  logout: () => void
  
  // Data
  partItems: PartItem[]
  partCatalogs: PartCatalog[]
  bookings: Booking[]
  wishlists: Wishlist[]
  notifications: Notification[]
  
  // Customer Actions
  createBooking: (itemId: number, date: string, time: string) => void
  cancelBooking: (bookingId: number) => void
  addToWishlist: (catalogId: number) => void
  removeFromWishlist: (wishlistId: number) => void
  
  // Dealer Actions
  addPartItem: (item: Omit<PartItem, 'Item_ID'>) => void
  updatePartItem: (itemId: number, updates: Partial<Pick<PartItem, 'Catalog_ID' | 'Garage_ID' | 'Condition' | 'Price' | 'Status'>>) => void
  addPartCatalog: (catalog: Omit<PartCatalog, 'Catalog_ID'>) => void
  markBookingStatus: (bookingId: number, status: 'Completed' | 'No-Show' | 'Cancelled') => void
  
  // Notification Actions
  markNotificationRead: (notificationId: number) => void
  markAllNotificationsRead: () => void
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  partItems: initialPartItems,
  partCatalogs: initialPartCatalogs,
  bookings: initialBookings,
  wishlists: initialWishlist,
  notifications: initialNotifications,
  
  login: (name: string) => {
    // Check if customer
    const customer = customers.find(
      c => c.Name.toLowerCase() === name.toLowerCase() && c.Is_Active
    )
    if (customer) {
      set({ user: { type: 'customer', id: customer.Customer_ID, name: customer.Name } })
      return { success: true, type: 'customer' as const }
    }
    
    // Check if dealer
    const dealer = scrapDealers.find(
      d => d.Name.toLowerCase() === name.toLowerCase() && d.Is_Active
    )
    if (dealer) {
      set({ user: { type: 'dealer', id: dealer.Dealer_ID, name: dealer.Name } })
      return { success: true, type: 'dealer' as const }
    }
    
    return { success: false, error: 'User not found or inactive' }
  },
  
  logout: () => set({ user: null }),
  
  createBooking: (itemId: number, date: string, time: string) => {
    const { user, bookings, partItems } = get()
    if (!user || user.type !== 'customer') return
    
    const newBooking: Booking = {
      Booking_ID: Math.max(...bookings.map(b => b.Booking_ID), 0) + 1,
      Booking_Date: date,
      Booking_Time: time,
      Booking_Status: 'Pending',
      Customer_ID: user.id,
      Item_ID: itemId,
    }
    
    // Trigger: Auto book part item
    const updatedItems = partItems.map(item => 
      item.Item_ID === itemId && item.Status === 'Available'
        ? { ...item, Status: 'Booked' as const }
        : item
    )
    
    set({ 
      bookings: [...bookings, newBooking],
      partItems: updatedItems,
    })
  },
  
  cancelBooking: (bookingId: number) => {
    const { bookings, partItems, wishlists, notifications, partCatalogs } = get()
    const booking = bookings.find(b => b.Booking_ID === bookingId)
    if (!booking) return
    
    const partItem = partItems.find(p => p.Item_ID === booking.Item_ID)
    if (!partItem) return
    
    // Trigger: Update part on booking status change
    const updatedItems = partItems.map(item => 
      item.Item_ID === booking.Item_ID
        ? { ...item, Status: 'Available' as const }
        : item
    )
    
    const updatedBookings = bookings.map(b => 
      b.Booking_ID === bookingId
        ? { ...b, Booking_Status: 'Cancelled' as const }
        : b
    )
    
    // Trigger: Notify wishlist customers when part becomes Available
    const catalog = partCatalogs.find(c => c.Catalog_ID === partItem.Catalog_ID)
    const wishlistsToNotify = wishlists.filter(
      w => w.Catalog_ID === partItem.Catalog_ID && !w.Notified
    )
    
    const newNotifications: Notification[] = wishlistsToNotify.map((w, index) => ({
      Notification_ID: Math.max(...notifications.map(n => n.Notification_ID), 0) + 1 + index,
      From_Garage_ID: partItem.Garage_ID,
      To_Customer_ID: w.Customer_ID,
      Message: `Good news! A ${catalog?.Category || 'part'} (${catalog?.Brand} ${catalog?.Model}) from your wishlist is now available.`,
      Created_At: new Date().toISOString(),
      Is_Read: false,
    }))
    
    const updatedWishlists = wishlists.map(w => 
      w.Catalog_ID === partItem.Catalog_ID && !w.Notified
        ? { ...w, Notified: true }
        : w
    )
    
    set({ 
      bookings: updatedBookings, 
      partItems: updatedItems,
      notifications: [...notifications, ...newNotifications],
      wishlists: updatedWishlists,
    })
  },
  
  addToWishlist: (catalogId: number) => {
    const { user, wishlists } = get()
    if (!user || user.type !== 'customer') return
    
    // Check if already in wishlist
    const exists = wishlists.some(
      w => w.Customer_ID === user.id && w.Catalog_ID === catalogId
    )
    if (exists) return
    
    const newWishlist: Wishlist = {
      Wishlist_ID: Math.max(...wishlists.map(w => w.Wishlist_ID), 0) + 1,
      Customer_ID: user.id,
      Catalog_ID: catalogId,
      Notified: false,
      Created_At: new Date().toISOString(),
    }
    
    set({ wishlists: [...wishlists, newWishlist] })
  },
  
  removeFromWishlist: (wishlistId: number) => {
    const { wishlists } = get()
    set({ wishlists: wishlists.filter(w => w.Wishlist_ID !== wishlistId) })
  },
  
  addPartItem: (item: Omit<PartItem, 'Item_ID'>) => {
    const { partItems } = get()
    const newItem: PartItem = {
      Item_ID: Math.max(...partItems.map(i => i.Item_ID), 0) + 1,
      ...item,
    }
    set({ partItems: [...partItems, newItem] })
  },
  
  updatePartItem: (itemId: number, updates: Partial<Pick<PartItem, 'Catalog_ID' | 'Garage_ID' | 'Condition' | 'Price' | 'Status'>>) => {
    const { partItems } = get()
    set({
      partItems: partItems.map(item => 
        item.Item_ID === itemId ? { ...item, ...updates } : item
      ),
    })
  },
  
  addPartCatalog: (catalog: Omit<PartCatalog, 'Catalog_ID'>) => {
    const { partCatalogs } = get()
    const newCatalog: PartCatalog = {
      Catalog_ID: Math.max(...partCatalogs.map(c => c.Catalog_ID), 0) + 1,
      ...catalog,
    }
    set({ partCatalogs: [...partCatalogs, newCatalog] })
  },
  
  markBookingStatus: (bookingId: number, status: 'Completed' | 'No-Show' | 'Cancelled') => {
    const { bookings, partItems, wishlists, notifications, partCatalogs } = get()
    const booking = bookings.find(b => b.Booking_ID === bookingId)
    if (!booking) return
    
    const partItem = partItems.find(p => p.Item_ID === booking.Item_ID)
    if (!partItem) return
    
    // Trigger: Update part based on status
    let newItemStatus: 'Available' | 'Sold' | 'Booked' = 'Booked'
    if (status === 'Completed') {
      newItemStatus = 'Sold'
    } else if (status === 'No-Show' || status === 'Cancelled') {
      newItemStatus = 'Available'
    }
    
    const updatedItems = partItems.map(item => 
      item.Item_ID === booking.Item_ID
        ? { ...item, Status: newItemStatus }
        : item
    )
    
    const updatedBookings = bookings.map(b => 
      b.Booking_ID === bookingId ? { ...b, Booking_Status: status } : b
    )
    
    // Trigger: Notify wishlist customers when part becomes Available
    let newNotifications: Notification[] = []
    let updatedWishlists = wishlists
    
    if (newItemStatus === 'Available') {
      const catalog = partCatalogs.find(c => c.Catalog_ID === partItem.Catalog_ID)
      const wishlistsToNotify = wishlists.filter(
        w => w.Catalog_ID === partItem.Catalog_ID && !w.Notified
      )
      
      newNotifications = wishlistsToNotify.map((w, index) => ({
        Notification_ID: Math.max(...notifications.map(n => n.Notification_ID), 0) + 1 + index,
        From_Garage_ID: partItem.Garage_ID,
        To_Customer_ID: w.Customer_ID,
        Message: `Good news! A ${catalog?.Category || 'part'} (${catalog?.Brand} ${catalog?.Model}) from your wishlist is now available.`,
        Created_At: new Date().toISOString(),
        Is_Read: false,
      }))
      
      updatedWishlists = wishlists.map(w => 
        w.Catalog_ID === partItem.Catalog_ID && !w.Notified
          ? { ...w, Notified: true }
          : w
      )
    }
    
    set({ 
      bookings: updatedBookings, 
      partItems: updatedItems,
      notifications: [...notifications, ...newNotifications],
      wishlists: updatedWishlists,
    })
  },
  
  markNotificationRead: (notificationId: number) => {
    const { notifications } = get()
    set({
      notifications: notifications.map(n =>
        n.Notification_ID === notificationId ? { ...n, Is_Read: true } : n
      ),
    })
  },
  
  markAllNotificationsRead: () => {
    const { notifications, user } = get()
    if (!user) return
    set({
      notifications: notifications.map(n =>
        n.To_Customer_ID === user.id ? { ...n, Is_Read: true } : n
      ),
    })
  },
}))
