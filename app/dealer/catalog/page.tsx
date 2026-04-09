"use client"

import { useState, useEffect, useCallback } from "react"
import { useStore } from "@/lib/store"
import type { PartCatalog } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty } from "@/components/ui/empty"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { BookOpen, Plus, Search, Tag, Car } from "lucide-react"

export default function PartCatalogPage() {
  const [catalogs, setCatalogs] = useState<PartCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCatalog, setNewCatalog] = useState({ Category: "", Brand: "", Model: "" })

  const fetchCatalogs = useCallback(async () => {
    const res = await fetch("/api/catalogs")
    setCatalogs(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchCatalogs() }, [fetchCatalogs])

  const filteredCatalogs = catalogs.filter(c => {
    const q = searchQuery.toLowerCase()
    return c.Category.toLowerCase().includes(q) || c.Brand.toLowerCase().includes(q) || c.Model.toLowerCase().includes(q)
  })

  const uniqueCategories = [...new Set(catalogs.map(c => c.Category))]
  const uniqueBrands = [...new Set(catalogs.map(c => c.Brand))]

  const handleAddCatalog = async () => {
    if (!newCatalog.Category || !newCatalog.Brand || !newCatalog.Model) return
    await fetch("/api/catalogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCatalog),
    })
    setNewCatalog({ Category: "", Brand: "", Model: "" })
    setIsAddDialogOpen(false)
    fetchCatalogs()
  }

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-foreground">Part Catalog</h1><p className="text-muted-foreground">View all available part categories and add new ones</p></div>
        <Button onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Catalog Entry</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><BookOpen className="w-5 h-5 text-foreground" /></div><div><p className="text-2xl font-bold text-foreground">{catalogs.length}</p><p className="text-sm text-muted-foreground">Total Entries</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Tag className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{uniqueCategories.length}</p><p className="text-sm text-muted-foreground">Categories</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center"><Car className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div><div><p className="text-2xl font-bold text-foreground">{uniqueBrands.length}</p><p className="text-sm text-muted-foreground">Brands</p></div></div></CardContent></Card>
      </div>

      {/* Search */}
      <Card><CardContent className="pt-6"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search by category, brand, or model..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div></CardContent></Card>

      {/* Catalog List */}
      {filteredCatalogs.length === 0 ? (
        <Card><CardContent className="py-12"><Empty icon={BookOpen} title="No catalog entries found" description={searchQuery ? "No entries match your search" : "Add your first catalog entry to get started"} /></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCatalogs.map(catalog => (
            <Card key={catalog.Catalog_ID}>
              <CardHeader className="pb-3"><div className="flex items-start justify-between"><Badge variant="secondary" className="text-xs">ID: {catalog.Catalog_ID}</Badge></div></CardHeader>
              <CardContent><div className="space-y-2"><h3 className="font-semibold text-lg text-foreground">{catalog.Category}</h3><div className="flex items-center gap-2 text-sm text-muted-foreground"><Car className="w-4 h-4" /><span>{catalog.Brand}</span><span className="text-muted-foreground/50">|</span><span>{catalog.Model}</span></div></div></CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Catalog Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Add New Catalog Entry</DialogTitle><DialogDescription>Add a new part category to the catalog. This will be available for all dealers.</DialogDescription></DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>Category</FieldLabel><Input placeholder="e.g., Engine, Headlight, Bumper" value={newCatalog.Category} onChange={(e) => setNewCatalog(p => ({ ...p, Category: e.target.value }))} /></Field>
            <Field><FieldLabel>Brand</FieldLabel><Input placeholder="e.g., Maruti, Tata, Honda" value={newCatalog.Brand} onChange={(e) => setNewCatalog(p => ({ ...p, Brand: e.target.value }))} /></Field>
            <Field><FieldLabel>Model</FieldLabel><Input placeholder="e.g., Swift, Indica, City" value={newCatalog.Model} onChange={(e) => setNewCatalog(p => ({ ...p, Model: e.target.value }))} /></Field>
          </FieldGroup>
          <div className="flex gap-3 mt-4"><Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button><Button className="flex-1" onClick={handleAddCatalog} disabled={!newCatalog.Category || !newCatalog.Brand || !newCatalog.Model}>Add Entry</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
