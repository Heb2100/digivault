// src/store/useOtcStore.ts
import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface OtcPost {
  id: string
  seller: string
  token: string
  amount: number
  price: number
  createdAt: string
}

interface OtcStore {
  posts: OtcPost[]
  addPost: (post: Omit<OtcPost, 'id' | 'createdAt'>) => void
  searchPosts: (query: string) => OtcPost[]
}

export const useOtcStore = create<OtcStore>((set, get) => ({
  posts: [],
  addPost: (post) => {
    const newPost: OtcPost = {
      ...post,
      id: nanoid(),
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ posts: [newPost, ...state.posts] }))
  },
  searchPosts: (query) => {
    return get().posts.filter(
      (p) =>
        p.token.toLowerCase().includes(query.toLowerCase()) ||
        p.seller.toLowerCase().includes(query.toLowerCase())
    )
  },
}))