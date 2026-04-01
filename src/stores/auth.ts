import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { clearCachedKitaId } from '@/utils/tenant/client'

/** PostgREST / Supabase client errors sometimes omit enumerable props; stringify for DevTools. */
function formatFetchProfileError(err: unknown): string {
  if (err == null) return 'unknown (null/undefined)'
  if (typeof err === 'string') return err
  if (err instanceof Error) {
    const anyErr = err as Error & { code?: string; details?: string; hint?: string }
    const extra = [anyErr.code, anyErr.details, anyErr.hint].filter(Boolean).join(' | ')
    return extra ? `${err.name}: ${err.message} (${extra})` : `${err.name}: ${err.message}`
  }
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>
    const parts: string[] = []
    for (const key of Object.getOwnPropertyNames(o)) {
      const v = o[key]
      if (v !== undefined && v !== '') parts.push(`${key}=${String(v)}`)
    }
    if (parts.length > 0) return parts.join('; ')
  }
  return String(err)
}

export interface Profile {
  id: string
  role: 'admin' | 'teacher' | 'parent' | 'kitchen' | 'support' | 'staff'
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  kita_id?: string
  default_kita_id?: string
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  /** True after first session check and, when logged in, profile fetch finished (success or failure). */
  authHydrated: boolean
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  authHydrated: false,
  loading: false,

  setUser: (user) => {
    // Clear stale profile whenever auth user changes.
    const currentUserId = get().user?.id
    if (!user) {
      clearCachedKitaId()
      set({ user: null, profile: null, authHydrated: true })
      return
    }
    if (currentUserId && currentUserId !== user.id) {
      clearCachedKitaId()
      set({ user, profile: null, authHydrated: false })
      return
    }
    set({ user })
  },
  
  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { user } = get()
    if (!user || !user.id) {
      console.warn('fetchProfile: No user available')
      return
    }

    const applyKitaFromMembership = (row: Record<string, unknown>) => {
      const profileData = { ...row } as Record<string, unknown>
      const om = profileData.organization_members as
        | { kita_id?: string }
        | { kita_id?: string }[]
        | null
        | undefined
      const first =
        Array.isArray(om) ? om[0] : om && typeof om === 'object' ? om : undefined
      if (!profileData.kita_id && first?.kita_id) {
        profileData.kita_id = first.kita_id
      }
      if (!profileData.kita_id && profileData.default_kita_id) {
        profileData.kita_id = profileData.default_kita_id
      }
      if (!profileData.kita_id) {
        console.warn(
          `[fetchProfile] User ${user.email} has no assigned kita_id. Data access may be restricted by RLS.`,
        )
      }
      delete profileData.organization_members
      set({ profile: profileData as unknown as Profile })
    }

    try {
      const supabase = createClient()

      // 1) Server route uses service role — bypasses broken profiles RLS (42P17) entirely.
      try {
        const res = await fetch('/api/auth/my-profile', {
          credentials: 'same-origin',
          cache: 'no-store',
        })
        if (res.ok) {
          const payload: unknown = await res.json()
          if (payload === null) {
            console.error('[fetchProfile] Profile not found for authenticated user (API).', {
              userId: user.id,
              email: user.email,
            })
            return
          }
          if (typeof payload === 'object' && payload !== null && 'id' in payload) {
            applyKitaFromMembership(payload as Record<string, unknown>)
            return
          }
        } else if (res.status !== 401) {
          console.warn(`[fetchProfile] /api/auth/my-profile HTTP ${res.status}`)
        }
      } catch (apiErr) {
        console.warn('[fetchProfile] /api/auth/my-profile failed:', apiErr)
      }

      // 2) DB RPC (row_security off inside function) — no direct .from('profiles') on the anon client.
      const { data: hydrated, error: rpcError } = await supabase.rpc('get_my_profile_hydration')
      if (!rpcError) {
        if (hydrated != null && typeof hydrated === 'object') {
          applyKitaFromMembership(hydrated as Record<string, unknown>)
          return
        }
        console.error('[fetchProfile] Profile not found for authenticated user (RPC returned empty).', {
          userId: user.id,
          email: user.email,
        })
        return
      }
      console.error(
        `[fetchProfile] get_my_profile_hydration failed (ensure migration is applied): ${formatFetchProfileError(rpcError)}`,
      )
    } catch (e: unknown) {
      console.error('Unexpected error in fetchProfile:', e instanceof Error ? e.message : e)
    } finally {
      set({ authHydrated: true })
    }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearCachedKitaId()
    set({ user: null, profile: null, authHydrated: true })
  }
}))
