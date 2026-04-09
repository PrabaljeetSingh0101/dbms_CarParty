"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Wrench, User, Store } from "lucide-react"

export default function LoginPage() {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const setUser = useStore((state) => state.setUser)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()

      if (data.success) {
        setUser({ type: data.type, id: data.id, name: data.name })
        if (data.type === "customer") {
          router.push("/customer")
        } else {
          router.push("/dealer")
        }
      } else {
        setError(data.error || "Login failed")
      }
    } catch {
      setError("Network error. Please try again.")
    }
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Wrench className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">AutoParts Hub</h1>
          <p className="text-muted-foreground mt-2">Find and book quality scrap parts</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your name to continue as a customer or dealer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Your Name</FieldLabel>
                  <Input
                    type="text"
                    placeholder="Enter your registered name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
              </FieldGroup>

              {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
              )}

              <Button type="submit" className="w-full mt-4" disabled={isLoading || !name.trim()}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Demo accounts:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                  <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Customers</p>
                    <p className="text-xs text-muted-foreground">Menka Devi, Savitri Devi, Mewa Singh, Meera Bai</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                  <Store className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Dealers</p>
                    <p className="text-xs text-muted-foreground">Ramachandra, Mohandas, Bhaskar</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
