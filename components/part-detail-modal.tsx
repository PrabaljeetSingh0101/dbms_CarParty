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

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

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
import { MapPin, Phone, User, Users, Building, Tag, Calendar, Clock, CheckCircle, AlertTriangle } from "lucide-react"

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
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResults, setSimulationResults] = useState<{user1: string, user2: string} | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const details = part

  const handleBooking = async () => {
    if (!date || !time || !user) return
    setIsSubmitting(true)
    setErrorMsg(null)
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
      if (res.ok && data.success) {
        setIsBooked(true)
        onBookingComplete?.()
      } else {
        setErrorMsg(data.error || "Failed to confirm booking. Please try again.")
      }
    } catch (error) {
      console.error("Booking error:", error)
      setErrorMsg("A network error occurred. Please try again.")
    }
    setIsSubmitting(false)
  }

  const handleSimulateConcurrency = async () => {
    if (!date || !time || !user) return
    setIsSimulating(true)
    setSimulationResults(null)
    setErrorMsg(null)
    
    // Create two dummy requests
    const req1 = fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Customer_ID: user.id, // Actual user
        Item_ID: part.Item_ID,
        Booking_Date: date,
        Booking_Time: time,
      }),
    }).then(res => res.json())

    const req2 = fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Customer_ID: user.id === 1 ? 2 : 1, // Another user
        Item_ID: part.Item_ID,
        Booking_Date: date,
        Booking_Time: time,
      }),
    }).then(res => res.json())

    try {
      const [res1, res2] = await Promise.all([req1, req2])
      
      setSimulationResults({
        user1: res1.success ? "Success: Booking confirmed." : `Failed: ${res1.error}`,
        user2: res2.success ? "Success: Booking confirmed." : `Failed: ${res2.error}`,
      })
      
      if (res1.success || res2.success) {
        onBookingComplete?.()
      }
    } catch(err) {
      console.error(err)
      setErrorMsg("Simulation failed due to a network error. Please try again.")
    }
    
    setIsSimulating(false)
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

  if (simulationResults) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl">Transaction Simulation</DialogTitle>
            <DialogDescription className="mt-2 text-center">
              We simulated 2 users trying to book this item at the exact same moment. 
              Here is how the database prevented a double booking:
            </DialogDescription>
            
            <div className="w-full mt-6 space-y-3">
              <Alert variant={simulationResults.user1.includes("Success") ? "default" : "destructive"} className={simulationResults.user1.includes("Success") ? "bg-green-500/10 text-green-700 border-green-500/20" : ""}>
                <AlertTitle>Customer 1 (You)</AlertTitle>
                <AlertDescription className={simulationResults.user1.includes("Success") ? "text-green-600 dark:text-green-500" : ""}>{simulationResults.user1}</AlertDescription>
              </Alert>
              <Alert variant={simulationResults.user2.includes("Success") ? "default" : "destructive"} className={simulationResults.user2.includes("Success") ? "bg-green-500/10 text-green-700 border-green-500/20" : ""}>
                <AlertTitle>Customer 2 (Simulated)</AlertTitle>
                <AlertDescription className={simulationResults.user2.includes("Success") ? "text-green-600 dark:text-green-500" : ""}>{simulationResults.user2}</AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-3 mt-6 w-full">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button className="flex-1" onClick={handleViewBookings}>
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

          {errorMsg && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Booking Failed</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

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
              disabled={!date || !time || isSubmitting || isSimulating}
            >
              {isSubmitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
          <div className="pt-2">
            <Button 
              variant="secondary"
              className="w-full bg-blue-100/50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300" 
              onClick={handleSimulateConcurrency}
              disabled={!date || !time || isSubmitting || isSimulating}
            >
              {isSimulating ? (
                "Simulating Concurrency..."
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Simulate Concurrent Booking
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
