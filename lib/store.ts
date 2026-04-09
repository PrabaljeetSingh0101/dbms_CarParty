"use client"

import { create } from 'zustand'

interface User {
  type: 'customer' | 'dealer'
  id: number
  name: string
}

interface AuthState {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
}

export const useStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user: User) => set({ user }),
  logout: () => set({ user: null }),
}))
