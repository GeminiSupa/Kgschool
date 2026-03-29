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
  role: 'admin' | 'teacher' | 'parent' | 'kitchen' | 'support'
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
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,

  setUser: (user) => {
    // Clear stale profile whenever auth user changes.
    const currentUserId = get().user?.id
    if (!user) {
      clearCachedKitaId()
      set({ user: null, profile: null })
      return
    }
    if (currentUserId && currentUserId !== user.id) {
      clearCachedKitaId()
      set({ user, profile: null })
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

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error(
          `[fetchProfile] ${formatFetchProfileError(error)} | rawMessage=${JSON.stringify((error as { message?: string }).message)}`,
        )
        return
      }

      if (data) {
        const profileData = data as Profile
        // Map default_kita_id to kita_id for backward compatibility across the app
        if (!profileData.kita_id && profileData.default_kita_id) {
            profileData.kita_id = profileData.default_kita_id
        }
        set({ profile: profileData })
      } else {
        console.warn(
          'fetchProfile: No profile row for this user. Check RLS policy "Users can view their own profile" and that handle_new_user / registration created public.profiles.',
          { userId: user.id },
        )
      }
    } catch (e: unknown) {
      console.error('Error in fetchProfile:', e instanceof Error ? e.message : e)
    }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearCachedKitaId()
    set({ user: null, profile: null })
  }
}))
