"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { DealerHeader } from "@/components/dealer-header"

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useStore((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    if (!user || user.type !== "dealer") {
      router.push("/")
    }
  }, [user, router])

  if (!user || user.type !== "dealer") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DealerHeader />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
