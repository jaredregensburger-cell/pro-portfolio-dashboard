'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthUser {
  id: string
  email: string | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean

  initAuth: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: {
    email: string
    password: string
    displayName: string
    metadata?: Record<string, unknown>
  }) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initAuth: async () => {
    set({ loading: true })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    set({
      user: user ? { id: user.id, email: user.email ?? null } : null,
      loading: false,
      initialized: true,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? null,
            }
          : null,
      })
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    set({ loading: false })

    if (error) throw error

    set({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email ?? null,
          }
        : null,
    })
  },

  signUp: async ({ email, password, displayName, metadata }) => {
    set({ loading: true })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          ...metadata,
        },
      },
    })

    set({ loading: false })

    if (error) throw error

    set({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email ?? null,
          }
        : null,
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
