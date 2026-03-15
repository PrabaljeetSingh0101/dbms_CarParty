"use client"

import { useState, useMemo } from "react"
import type { PartItem as PartItemType, PartCatalog, Garage, ScrapDealer } from "@/lib/data"
import { useStore } from "@/lib/store"
import { garages, scrapDealers, formatPrice } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Search, MapPin, Phone, Tag, Heart, Calendar } from "lucide-react"
import { PartDetailModal } from "@/components/part-detail-modal"
interface PartWithDetails extends PartItemType {
  catalog?: PartCatalog
  garage?: Garage
  dealer?: ScrapDealer | null
}

export default function CustomerSearchPage() {
  const { partItems, partCatalogs, wishlists, user, addToWishlist } = useStore()
  
  const getPartWithDetails = (item: PartItemType): PartWithDetails => {
    const catalog = partCatalogs.find(c => c.Catalog_ID === item.Catalog_ID)
    const garage = garages.find(g => g.Garage_ID === item.Garage_ID)
    const dealer = garage ? scrapDealers.find(d => d.Dealer_ID === garage.Dealer_ID) : null
    return { ...item, catalog, garage, dealer }
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [conditionFilter, setConditionFilter] = useState<string>("all")
  const [selectedPart, setSelectedPart] = useState<PartWithDetails | null>(null)

  const categories = useMemo(() => [...new Set(partCatalogs.map(c => c.Category))], [])
  const brands = useMemo(() => [...new Set(partCatalogs.map(c => c.Brand))], [])

  const filteredParts = useMemo(() => {
    return partItems
      .filter(item => item.Status === "Available")
      .map(item => getPartWithDetails(item))
      .filter(item => {
        if (!item.catalog) return false

        const matchesSearch = searchQuery === "" || 
          item.catalog.Category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.catalog.Brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.catalog.Model.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory = categoryFilter === "all" || item.catalog.Category === categoryFilter
        const matchesBrand = brandFilter === "all" || item.catalog.Brand === brandFilter
        const matchesCondition = conditionFilter === "all" || item.Condition === conditionFilter

        return matchesSearch && matchesCategory && matchesBrand && matchesCondition
      })
  }, [partItems, searchQuery, categoryFilter, brandFilter, conditionFilter])

  const isInWishlist = (catalogId: number) => {
    return wishlists.some(w => w.Customer_ID === user?.id && w.Catalog_ID === catalogId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Search Parts</h1>
        <p className="text-muted-foreground">Find quality scrap parts from verified dealers</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by category, brand, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No parts found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredParts.map(item => (
            <Card key={item.Item_ID} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.catalog?.Category}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {item.catalog?.Brand} - {item.catalog?.Model}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      item.Condition === "Good" ? "default" : 
                      item.Condition === "Fair" ? "secondary" : "destructive"
                    }
                  >
                    {item.Condition}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{item.garage?.Name}, {item.garage?.Location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{item.dealer?.Name} - {item.dealer?.Contact_No}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-lg font-semibold text-foreground">{formatPrice(item.Price)}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => setSelectedPart(item)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Now
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => item.catalog && addToWishlist(item.catalog.Catalog_ID)}
                    disabled={item.catalog ? isInWishlist(item.catalog.Catalog_ID) : true}
                  >
                    <Heart 
                      className={`w-4 h-4 ${item.catalog && isInWishlist(item.catalog.Catalog_ID) ? "fill-current text-red-500" : ""}`} 
                    />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedPart && (
        <PartDetailModal
          part={selectedPart}
          open={!!selectedPart}
          onClose={() => setSelectedPart(null)}
        />
      )}
    </div>
  )
}
