"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { CustomerHeader } from "@/components/customer-header"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useStore((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    if (!user || user.type !== "customer") {
      router.push("/")
    }
  }, [user, router])

  if (!user || user.type !== "customer") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
