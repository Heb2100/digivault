// src/store/useWalletStore.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type TokenBalance = {
  symbol: string
  balance: string
}

type WalletState = {
  ethBalance: string
  tokenBalances: TokenBalance[]
  setEthBalance: (bal: string) => void
  setTokenBalances: (tokens: TokenBalance[]) => void
  upbitAccessKey?: string
  upbitSecretKey?: string
  setUpbitKeys?: (accessKey: string, secretKey: string) => void
}

export const useWalletStore = create(
  persist<WalletState>(
    (set) => ({
      ethBalance: '',
      tokenBalances: [],
      setEthBalance: (bal) => set({ ethBalance: bal }),
      setTokenBalances: (tokens) => set({ tokenBalances: tokens }),
      upbitAccessKey: '',
      upbitSecretKey: '',
      setUpbitKeys: (accessKey, secretKey) => set({ upbitAccessKey: accessKey, upbitSecretKey: secretKey }),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)