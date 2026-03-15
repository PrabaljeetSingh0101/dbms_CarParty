"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { garages, customers, formatPrice, formatDate, formatTime } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Empty } from "@/components/ui/empty"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Tag, 
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal
} from "lucide-react"

export default function DealerBookingsPage() {
  const { user, bookings, partItems, partCatalogs, markBookingStatus } = useStore()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [actionBooking, setActionBooking] = useState<number | null>(null)

  // Get garages belonging to this dealer
  const dealerGarageIds = useMemo(() => {
    return garages.filter(g => g.Dealer_ID === user?.id).map(g => g.Garage_ID)
  }, [user])

  // Get bookings for parts in dealer's garages
  const dealerBookings = useMemo(() => {
    return bookings
      .filter(booking => {
        const item = partItems.find(p => p.Item_ID === booking.Item_ID)
        return item && dealerGarageIds.includes(item.Garage_ID)
      })
      .map(booking => {
        const item = partItems.find(p => p.Item_ID === booking.Item_ID)
        const catalog = item ? partCatalogs.find(c => c.Catalog_ID === item.Catalog_ID) : null
        const garage = item ? garages.find(g => g.Garage_ID === item.Garage_ID) : null
        const customer = customers.find(c => c.Customer_ID === booking.Customer_ID)
        return { ...booking, item, catalog, garage, customer }
      })
      .filter(booking => statusFilter === "all" || booking.Booking_Status === statusFilter)
      .sort((a, b) => new Date(b.Booking_Date).getTime() - new Date(a.Booking_Date).getTime())
  }, [bookings, partItems, dealerGarageIds, statusFilter])

  const stats = useMemo(() => {
    const allDealerBookings = bookings.filter(booking => {
      const item = partItems.find(p => p.Item_ID === booking.Item_ID)
      return item && dealerGarageIds.includes(item.Garage_ID)
    })
    return {
      total: allDealerBookings.length,
      pending: allDealerBookings.filter(b => b.Booking_Status === "Pending").length,
      completed: allDealerBookings.filter(b => b.Booking_Status === "Completed").length,
      noShow: allDealerBookings.filter(b => b.Booking_Status === "No-Show").length,
      cancelled: allDealerBookings.filter(b => b.Booking_Status === "Cancelled").length,
    }
  }, [bookings, partItems, dealerGarageIds])

  const handleMarkStatus = (status: "Completed" | "No-Show" | "Cancelled") => {
    if (actionBooking) {
      markBookingStatus(actionBooking, status)
      setActionBooking(null)
    }
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-muted-foreground">Manage customer bookings for your parts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.noShow}</p>
            <p className="text-sm text-muted-foreground">No-Show</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.cancelled}</p>
            <p className="text-sm text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="No-Show">No-Show</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {dealerBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Calendar}
              title="No bookings found"
              description="No bookings match your current filter"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {dealerBookings.map(booking => (
            <Card 
              key={booking.Booking_ID} 
              className={booking.Booking_Status === "Pending" ? "border-l-4 border-l-blue-500" : ""}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      {getStatusIcon(booking.Booking_Status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
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
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Customer Info */}
                    <div className="text-sm bg-secondary/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <User className="w-4 h-4" />
                        {booking.customer?.Name}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Phone className="w-4 h-4" />
                        {booking.customer?.Contact_No}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        {booking.customer?.City}
                      </div>
                    </div>

                    {/* Actions for Pending bookings */}
                    {booking.Booking_Status === "Pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionBooking(booking.Booking_ID)}
                      >
                        <MoreHorizontal className="w-4 h-4 mr-2" />
                        Update Status
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionBooking !== null} onOpenChange={() => setActionBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Select the appropriate status for this booking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Button 
              className="w-full justify-start bg-green-600 hover:bg-green-700"
              onClick={() => handleMarkStatus("Completed")}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Completed (Sold)
              <span className="ml-auto text-xs opacity-75">Customer purchased the part</span>
            </Button>
            <Button 
              variant="outline"
              className="w-full justify-start border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
              onClick={() => handleMarkStatus("No-Show")}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Mark as No-Show
              <span className="ml-auto text-xs opacity-75">Part becomes available again</span>
            </Button>
            <Button 
              variant="outline"
              className="w-full justify-start border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => handleMarkStatus("Cancelled")}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Mark as Cancelled
              <span className="ml-auto text-xs opacity-75">Part becomes available again</span>
            </Button>
          </div>
          <Button variant="ghost" className="w-full mt-2" onClick={() => setActionBooking(null)}>
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
