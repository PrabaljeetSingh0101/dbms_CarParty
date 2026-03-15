"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Wrench, Search, Calendar, Heart, LogOut, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/customer", label: "Search Parts", icon: Search },
  { href: "/customer/bookings", label: "My Bookings", icon: Calendar },
  { href: "/customer/wishlist", label: "Wishlist", icon: Heart },
  { href: "/customer/notifications", label: "Notifications", icon: Bell },
]

export function CustomerHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, notifications } = useStore()
  
  const unreadCount = notifications.filter(n => n.To_Customer_ID === user?.id && !n.Is_Read).length

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/customer" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary">
                <Wrench className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">AutoParts Hub</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const showBadge = item.href === "/customer/notifications" && unreadCount > 0
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, <span className="text-foreground font-medium">{user?.name}</span>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const showBadge = item.href === "/customer/notifications" && unreadCount > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap relative",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
