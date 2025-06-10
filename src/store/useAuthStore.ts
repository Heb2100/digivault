import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  email: string | null
  setEmail: (email: string | null) => void
  clear: () => void
}

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      email: null,
      setEmail: (email) => set({ email }),
      clear: () => set({ email: null }),
    }),
    {
      name: 'auth-storage', // localStorage 키 이름
    }
  )
)