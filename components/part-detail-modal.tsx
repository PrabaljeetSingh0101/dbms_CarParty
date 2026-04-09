"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import type { PartCatalog, Garage, ScrapDealer } from "@/lib/data"
import { formatPrice } from "@/lib/data"

interface PartWithDetails {
  Item_ID: number
  Catalog_ID: number
  Garage_ID: number
  Condition: string
  Price: number
  Status: string
  catalog?: PartCatalog
  garage?: Garage
  dealer?: ScrapDealer
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Phone, User, Building, Tag, Calendar, Clock, CheckCircle } from "lucide-react"

interface PartDetailModalProps {
  part: PartWithDetails
  open: boolean
  onClose: () => void
  onBookingComplete?: () => void
}

export function PartDetailModal({ part, open, onClose, onBookingComplete }: PartDetailModalProps) {
  const router = useRouter()
  const user = useStore((s) => s.user)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [isBooked, setIsBooked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const details = part

  const handleBooking = async () => {
    if (!date || !time || !user) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Customer_ID: user.id,
          Item_ID: part.Item_ID,
          Booking_Date: date,
          Booking_Time: time,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setIsBooked(true)
        onBookingComplete?.()
      }
    } catch (error) {
      console.error("Booking error:", error)
    }
    setIsSubmitting(false)
  }

  const handleViewBookings = () => {
    onClose()
    router.push("/customer/bookings")
  }

  if (isBooked) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl">Booking Confirmed!</DialogTitle>
            <DialogDescription className="mt-2">
              Your booking for {details.catalog?.Category} has been confirmed. 
              Please arrive at the garage on {new Date(date).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at {time}.
            </DialogDescription>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={onClose}>
                Continue Browsing
              </Button>
              <Button onClick={handleViewBookings}>
                View My Bookings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {details.catalog?.Category}
            <Badge 
              variant={
                part.Condition === "Good" ? "default" : 
                part.Condition === "Fair" ? "secondary" : "destructive"
              }
            >
              {part.Condition}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {details.catalog?.Brand} - {details.catalog?.Model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price */}
          <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary/50">
            <Tag className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{formatPrice(part.Price)}</span>
          </div>

          {/* Garage Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Building className="w-4 h-4" />
              Garage Information
            </h3>
            <div className="pl-6 space-y-2 text-sm">
              <p className="text-foreground font-medium">{details.garage?.Name}</p>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {details.garage?.Location}
              </p>
            </div>
          </div>

          <Separator />

          {/* Dealer Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Dealer Information
            </h3>
            <div className="pl-6 space-y-2 text-sm">
              <p className="text-foreground font-medium">{details.dealer?.Name}</p>
              <p className="text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {details.dealer?.Contact_No}
              </p>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {details.dealer?.Location}
              </p>
            </div>
          </div>

          <Separator />

          {/* Booking Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Schedule Your Visit</h3>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Visit Date
                  </FieldLabel>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </Field>
                <Field>
                  <FieldLabel className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Visit Time
                  </FieldLabel>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </Field>
              </div>
            </FieldGroup>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleBooking}
              disabled={!date || !time || isSubmitting}
            >
              {isSubmitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
