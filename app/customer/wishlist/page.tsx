"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { formatPrice } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Heart, Trash2, Bell, BellOff, Search } from "lucide-react"

interface WishlistItem {
  Wishlist_ID: number
  Customer_ID: number
  Catalog_ID: number
  Notified: boolean
  catalog: { Category: string; Brand: string; Model: string }
  availableCount: number
  lowestPrice: number | null
}

export default function CustomerWishlistPage() {
  const user = useStore((s) => s.user)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWishlist = useCallback(async () => {
    if (!user) return
    const res = await fetch(`/api/wishlist?customer_id=${user.id}`)
    setWishlist(await res.json())
    setLoading(false)
  }, [user])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const removeFromWishlist = async (wishlistId: number) => {
    await fetch(`/api/wishlist?wishlist_id=${wishlistId}`, { method: "DELETE" })
    fetchWishlist()
  }

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>

  if (wishlist.length === 0) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-foreground">My Wishlist</h1><p className="text-muted-foreground">Parts you want to keep an eye on</p></div>
        <Card><CardContent className="py-12">
          <Empty icon={Heart} title="Your wishlist is empty" description="Add parts to your wishlist to get notified when they become available" />
          <div className="flex justify-center mt-4"><Button asChild><Link href="/customer"><Search className="w-4 h-4 mr-2" />Browse Parts</Link></Button></div>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">My Wishlist</h1><p className="text-muted-foreground">Parts you want to keep an eye on</p></div>
      <div className="grid gap-4">
        {wishlist.map(item => (
          <Card key={item.Wishlist_ID}><CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center"><Heart className="w-6 h-6 text-red-500 fill-current" /></div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{item.catalog?.Category}</h3>
                  <p className="text-sm text-muted-foreground">{item.catalog?.Brand} - {item.catalog?.Model}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {item.availableCount > 0 ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{item.availableCount} available</Badge> : <Badge variant="secondary">Out of stock</Badge>}
                    {item.Notified && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Bell className="w-3 h-3" />Notified</span>}
                  </div>
                  {item.lowestPrice && <p className="text-sm text-foreground mt-1">From <span className="font-semibold">{formatPrice(item.lowestPrice)}</span></p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.availableCount > 0 && <Button asChild size="sm"><Link href="/customer"><Search className="w-4 h-4 mr-2" />View Parts</Link></Button>}
                <Button variant="outline" size="sm" onClick={() => removeFromWishlist(item.Wishlist_ID)}><Trash2 className="w-4 h-4 mr-2" />Remove</Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <Card className="bg-secondary/30"><CardContent className="py-4">
        <div className="flex items-center gap-3"><BellOff className="w-5 h-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">You will be notified when parts from your wishlist become available. The database trigger automatically marks your wishlist as notified when a matching part is added.</p></div>
      </CardContent></Card>
    </div>
  )
}
