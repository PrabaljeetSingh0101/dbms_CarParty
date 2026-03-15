"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { garages, scrapDealers, formatPrice } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Bell, BellOff, Check, CheckCheck, Search, MapPin, Phone } from "lucide-react"

export default function CustomerNotificationsPage() {
  const { user, notifications, partItems, partCatalogs, markNotificationRead, markAllNotificationsRead } = useStore()

  const myNotifications = useMemo(() => {
    return notifications
      .filter(n => n.To_Customer_ID === user?.id)
      .map(notification => {
        const garage = garages.find(g => g.Garage_ID === notification.From_Garage_ID)
        const dealer = garage ? scrapDealers.find(d => d.Dealer_ID === garage.Dealer_ID) : null
        return { ...notification, garage, dealer }
      })
      .sort((a, b) => new Date(b.Created_At).getTime() - new Date(a.Created_At).getTime())
  }, [notifications, user])

  const unreadCount = myNotifications.filter(n => !n.Is_Read).length

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (myNotifications.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your wishlist parts</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={BellOff}
              title="No notifications yet"
              description="When parts from your wishlist become available, you'll be notified here"
            />
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href="/customer/wishlist">
                  <Search className="w-4 h-4 mr-2" />
                  View Wishlist
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {myNotifications.map(notification => (
          <Card 
            key={notification.Notification_ID}
            className={notification.Is_Read ? "bg-background" : "bg-primary/5 border-primary/20"}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.Is_Read ? "bg-secondary" : "bg-primary/10"
                  }`}>
                    <Bell className={`w-5 h-5 ${notification.Is_Read ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {!notification.Is_Read && (
                        <Badge className="bg-primary text-primary-foreground">New</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.Created_At)}</span>
                    </div>
                    <p className="text-foreground">{notification.Message}</p>
                    
                    {notification.garage && (
                      <div className="mt-3 p-3 bg-secondary/50 rounded-lg space-y-2">
                        <p className="font-medium text-sm text-foreground">{notification.garage.Name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {notification.garage.Location}
                          </span>
                          {notification.dealer && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {notification.dealer.Contact_No}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-14 md:ml-0">
                  <Button asChild size="sm">
                    <Link href="/customer">
                      <Search className="w-4 h-4 mr-2" />
                      View Parts
                    </Link>
                  </Button>
                  {!notification.Is_Read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markNotificationRead(notification.Notification_ID)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
