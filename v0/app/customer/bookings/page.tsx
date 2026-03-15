"use client"

import { useMemo } from "react"
import { useStore } from "@/lib/store"
import { garages, scrapDealers, formatPrice, formatDate, formatTime } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Calendar, MapPin, Phone, Tag, X, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function CustomerBookingsPage() {
  const { user, bookings, partItems, partCatalogs, cancelBooking } = useStore()

  const myBookings = useMemo(() => {
    return bookings
      .filter(b => b.Customer_ID === user?.id)
      .map(booking => {
        const item = partItems.find(p => p.Item_ID === booking.Item_ID)
        const catalog = item ? partCatalogs.find(c => c.Catalog_ID === item.Catalog_ID) : null
        const garage = item ? garages.find(g => g.Garage_ID === item.Garage_ID) : null
        const dealer = garage ? scrapDealers.find(d => d.Dealer_ID === garage.Dealer_ID) : null
        return { ...booking, item, catalog, garage, dealer }
      })
      .sort((a, b) => new Date(b.Booking_Date).getTime() - new Date(a.Booking_Date).getTime())
  }, [bookings, partItems, user])

  const pendingBookings = myBookings.filter(b => b.Booking_Status === "Pending")
  const pastBookings = myBookings.filter(b => b.Booking_Status !== "Pending")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "No-Show":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "No-Show":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">No-Show</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Pending</Badge>
    }
  }

  if (myBookings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">Track your part bookings and appointments</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Calendar}
              title="No bookings yet"
              description="Search for parts and book your first appointment"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-muted-foreground">Track your part bookings and appointments</p>
      </div>

      {/* Active Bookings */}
      {pendingBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Active Bookings</h2>
          <div className="grid gap-4">
            {pendingBookings.map(booking => (
              <Card key={booking.Booking_ID} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{booking.catalog?.Category}</h3>
                        {getStatusBadge(booking.Booking_Status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.catalog?.Brand} - {booking.catalog?.Model}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.Booking_Date)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatTime(booking.Booking_Time)}
                        </span>
                        <span className="flex items-center gap-1 text-foreground font-medium">
                          <Tag className="w-4 h-4" />
                          {booking.item ? formatPrice(booking.item.Price) : "N/A"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.garage?.Name}, {booking.garage?.Location}
                        </span>
                        <span className="flex items-center gap-1 mt-1">
                          <Phone className="w-4 h-4" />
                          {booking.dealer?.Name} - {booking.dealer?.Contact_No}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => cancelBooking(booking.Booking_ID)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Past Bookings</h2>
          <div className="grid gap-4">
            {pastBookings.map(booking => (
              <Card key={booking.Booking_ID} className="opacity-75">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(booking.Booking_Status)}
                        <h3 className="font-semibold text-foreground">{booking.catalog?.Category}</h3>
                        {getStatusBadge(booking.Booking_Status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.catalog?.Brand} - {booking.catalog?.Model}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.Booking_Date)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatTime(booking.Booking_Time)}
                        </span>
                        <span className="flex items-center gap-1 text-foreground font-medium">
                          <Tag className="w-4 h-4" />
                          {booking.item ? formatPrice(booking.item.Price) : "N/A"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.garage?.Name}, {booking.garage?.Location}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
