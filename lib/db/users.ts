/**
 * /lib/db/users.ts
 * Auth + user profile helpers.
 */

import { supabase } from '@/lib/supabase'
import type { UserRow } from '@/types/database'

// Supabase generated types are currently too strict / broken in this project.
const db = supabase as any

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await db.auth.getUser()

  if (error) throw new Error(`getCurrentUser: ${error.message}`)

  return user
}

export async function signIn(email: string, password: string) {
  const { data, error } = await db.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(`signIn: ${error.message}`)

  return data
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (error) throw new Error(`signUp: ${error.message}`)

  return data
}

export async function signOut() {
  const { error } = await db.auth.signOut()

  if (error) throw new Error(`signOut: ${error.message}`)
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserRow | null> {
  const user = await getCurrentUser()

  if (!user) return null

  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error(`getUserProfile: ${error.message}`)

  return data as UserRow | null
}

export async function updateUserProfile(input: {
  displayName?: string
  avatarUrl?: string
  currency?: string
  timezone?: string
}): Promise<UserRow> {
  const user = await getCurrentUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await db
    .from('users')
    .update({
      ...(input.displayName !== undefined && {
        display_name: input.displayName,
      }),
      ...(input.avatarUrl !== undefined && {
        avatar_url: input.avatarUrl,
      }),
      ...(input.currency !== undefined && {
        currency: input.currency,
      }),
      ...(input.timezone !== undefined && {
        timezone: input.timezone,
      }),
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw new Error(`updateUserProfile: ${error.message}`)

  return data as UserRow
}
