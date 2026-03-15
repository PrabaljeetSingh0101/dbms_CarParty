"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { garages, formatPrice } from "@/lib/data"
import type { PartItem } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Package, MapPin, Tag, Edit, CheckCircle, Clock, XCircle, Search, Plus } from "lucide-react"

export default function DealerPartsPage() {
  const { user, partItems, partCatalogs, updatePartItem, addPartItem } = useStore()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingPart, setEditingPart] = useState<typeof partItems[0] | null>(null)
  const [isAddingPart, setIsAddingPart] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    catalogId: "",
    condition: "",
    price: "",
    status: "",
    garageId: "",
  })

  // Get garages belonging to this dealer
  const dealerGarages = useMemo(() => {
    return garages.filter(g => g.Dealer_ID === user?.id)
  }, [user])

  const dealerGarageIds = dealerGarages.map(g => g.Garage_ID)

  // Get parts from dealer's garages
  const dealerParts = useMemo(() => {
    return partItems
      .filter(item => dealerGarageIds.includes(item.Garage_ID))
      .map(item => {
        const catalog = partCatalogs.find(c => c.Catalog_ID === item.Catalog_ID)
        const garage = garages.find(g => g.Garage_ID === item.Garage_ID)
        return { ...item, catalog, garage }
      })
      .filter(item => {
        const matchesStatus = statusFilter === "all" || item.Status === statusFilter
        const matchesSearch = searchQuery === "" ||
          item.catalog?.Category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.catalog?.Brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.catalog?.Model.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesSearch
      })
  }, [partItems, partCatalogs, dealerGarageIds, statusFilter, searchQuery])

  const stats = useMemo(() => {
    const allDealerParts = partItems.filter(item => dealerGarageIds.includes(item.Garage_ID))
    return {
      total: allDealerParts.length,
      available: allDealerParts.filter(p => p.Status === "Available").length,
      booked: allDealerParts.filter(p => p.Status === "Booked").length,
      sold: allDealerParts.filter(p => p.Status === "Sold").length,
    }
  }, [partItems, dealerGarageIds])

  const handleEditPart = (part: PartItem) => {
    setEditingPart(part)
    setEditForm({
      catalogId: part.Catalog_ID.toString(),
      condition: part.Condition,
      price: part.Price.toString(),
      status: part.Status,
      garageId: part.Garage_ID.toString(),
    })
  }

  const handleSaveEdit = () => {
    if (editingPart) {
      updatePartItem(editingPart.Item_ID, {
        Catalog_ID: parseInt(editForm.catalogId),
        Condition: editForm.condition as "New" | "Used" | "Refurbished",
        Price: parseFloat(editForm.price),
        Status: editForm.status as "Available" | "Booked" | "Sold",
        Garage_ID: parseInt(editForm.garageId),
      })
      setEditingPart(null)
    }
  }

  const handleAddPart = () => {
    setIsAddingPart(true)
    setEditForm({
      catalogId: partCatalogs[0]?.Catalog_ID.toString() || "",
      condition: "Used",
      price: "",
      status: "Available",
      garageId: dealerGarages[0]?.Garage_ID.toString() || "",
    })
  }

  const handleSaveNewPart = () => {
    if (editForm.catalogId && editForm.price && editForm.garageId) {
      addPartItem({
        Catalog_ID: parseInt(editForm.catalogId),
        Condition: editForm.condition as "New" | "Used" | "Refurbished",
        Price: parseFloat(editForm.price),
        Status: "Available",
        Garage_ID: parseInt(editForm.garageId),
        Is_Active: true,
      })
      setIsAddingPart(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Available":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Booked":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "Sold":
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Available</Badge>
      case "Booked":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Booked</Badge>
      case "Sold":
        return <Badge variant="secondary">Sold</Badge>
      default:
        return null
    }
  }

  const getCatalogLabel = (catalogId: number) => {
    const catalog = partCatalogs.find(c => c.Catalog_ID === catalogId)
    return catalog ? `${catalog.Category} - ${catalog.Brand} ${catalog.Model}` : "Unknown"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Parts Inventory</h1>
          <p className="text-muted-foreground">Manage your parts across all garages</p>
        </div>
        <Button onClick={handleAddPart}>
          <Plus className="w-4 h-4 mr-2" />
          Add Part
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Package className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Parts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.booked}</p>
                <p className="text-sm text-muted-foreground">Booked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.sold}</p>
                <p className="text-sm text-muted-foreground">Sold</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search parts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Booked">Booked</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Parts List */}
      {dealerParts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={Package}
              title="No parts found"
              description="No parts match your current filters"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {dealerParts.map(part => (
            <Card key={part.Item_ID}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      {getStatusIcon(part.Status)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{part.catalog?.Category}</h3>
                        {getStatusBadge(part.Status)}
                        <Badge variant="outline">{part.Condition}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {part.catalog?.Brand} - {part.catalog?.Model}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {part.garage?.Name}, {part.garage?.Location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Catalog ID: {part.Catalog_ID} | Item ID: {part.Item_ID}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="text-lg font-semibold text-foreground">{formatPrice(part.Price)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPart(part)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Part Dialog */}
      <Dialog open={editingPart !== null} onOpenChange={() => setEditingPart(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
            <DialogDescription>
              Update the details for this part item
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Part Catalog</FieldLabel>
              <Select value={editForm.catalogId} onValueChange={(v) => setEditForm({...editForm, catalogId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select part catalog" />
                </SelectTrigger>
                <SelectContent>
                  {partCatalogs.map(catalog => (
                    <SelectItem key={catalog.Catalog_ID} value={catalog.Catalog_ID.toString()}>
                      {catalog.Category} - {catalog.Brand} {catalog.Model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Condition</FieldLabel>
              <Select value={editForm.condition} onValueChange={(v) => setEditForm({...editForm, condition: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                  <SelectItem value="Refurbished">Refurbished</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Price (INR)</FieldLabel>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                min="1"
                step="0.01"
              />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Garage</FieldLabel>
              <Select value={editForm.garageId} onValueChange={(v) => setEditForm({...editForm, garageId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select garage" />
                </SelectTrigger>
                <SelectContent>
                  {dealerGarages.map(garage => (
                    <SelectItem key={garage.Garage_ID} value={garage.Garage_ID.toString()}>
                      {garage.Name} - {garage.Location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setEditingPart(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Part Dialog */}
      <Dialog open={isAddingPart} onOpenChange={setIsAddingPart}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Part</DialogTitle>
            <DialogDescription>
              Add a new part to your inventory
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Part Catalog</FieldLabel>
              <Select value={editForm.catalogId} onValueChange={(v) => setEditForm({...editForm, catalogId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select part catalog" />
                </SelectTrigger>
                <SelectContent>
                  {partCatalogs.map(catalog => (
                    <SelectItem key={catalog.Catalog_ID} value={catalog.Catalog_ID.toString()}>
                      {catalog.Category} - {catalog.Brand} {catalog.Model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Condition</FieldLabel>
              <Select value={editForm.condition} onValueChange={(v) => setEditForm({...editForm, condition: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                  <SelectItem value="Refurbished">Refurbished</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Price (INR)</FieldLabel>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                min="1"
                step="0.01"
                placeholder="Enter price"
              />
            </Field>
            <Field>
              <FieldLabel>Garage</FieldLabel>
              <Select value={editForm.garageId} onValueChange={(v) => setEditForm({...editForm, garageId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select garage" />
                </SelectTrigger>
                <SelectContent>
                  {dealerGarages.map(garage => (
                    <SelectItem key={garage.Garage_ID} value={garage.Garage_ID.toString()}>
                      {garage.Name} - {garage.Location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddingPart(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveNewPart}>
              Add Part
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
