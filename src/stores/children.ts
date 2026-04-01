import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { useAuthStore } from '@/stores/auth'

function formatSupabaseErr(err: unknown): string {
  if (err == null) return 'unknown'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message || String(err)
  const o = err as { code?: string; message?: string; details?: string; hint?: string }
  return [o.code, o.message, o.details, o.hint].filter(Boolean).join(' | ') || JSON.stringify(err)
}

export interface Child {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  group_id?: string
  parent_ids: string[]
  photo_url?: string
  enrollment_date: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  kita_id?: string
}

interface ChildrenState {
  children: Child[]
  loading: boolean
  error: Error | null
  fetchChildren: (kitaId?: string) => Promise<void>
  fetchChildById: (id: string) => Promise<Child | null>
  fetchChildrenForTeacher: (teacherId: string) => Promise<void>
}

export const useChildrenStore = create<ChildrenState>((set, get) => ({
  children: [],
  loading: false,
  error: null,

  fetchChildren: async (kitaId?: string) => {
    set({ loading: true, error: null })

    try {
      let resolvedKitaId = kitaId ?? null
      if (resolvedKitaId == null) {
        resolvedKitaId = await getActiveKitaId()
      }

      const role = useAuthStore.getState().profile?.role

      if (!resolvedKitaId && role && role !== 'parent') {
        const msg =
          'No Kita is assigned to your profile. Children cannot be loaded until default_kita_id or organization membership is set.'
        console.warn('[fetchChildren]', msg)
        set({ children: [], error: new Error(msg) })
        return
      }

      const qs = resolvedKitaId ? `?kita_id=${encodeURIComponent(resolvedKitaId)}` : ''
      const res = await fetch(`/api/kita/children${qs}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (res.ok) {
        const payload: unknown = await res.json()
        if (Array.isArray(payload)) {
          set({ children: payload as Child[] })
          return
        }
      }
      console.warn('[fetchChildren] /api/kita/children not used (HTTP ' + res.status + '), client fallback')

      const supabase = createClient()
      let query = supabase
        .from('children')
        .select('*')
        .order('first_name', { ascending: true })

      if (resolvedKitaId) {
        query = query.eq('kita_id', resolvedKitaId)
      }

      const { data, error } = await query

      if (error) throw error
      set({ children: data || [] })
    } catch (e: unknown) {
      console.error('Error fetching children:', formatSupabaseErr(e), e)
      set({ error: e instanceof Error ? e : new Error(formatSupabaseErr(e)) })
    } finally {
      set({ loading: false })
    }
  },

  fetchChildById: async (id: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Child
    } catch (e: unknown) {
      console.error('Error fetching child:', formatSupabaseErr(e), e)
      return null
    }
  },

  fetchChildrenForTeacher: async (teacherId: string) => {
    set({ loading: true, error: null })

    try {
      const supabase = createClient()
      
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id')
        .eq('educator_id', teacherId)

      if (groupsError) throw groupsError

      if (!groups || groups.length === 0) {
        set({ children: [] })
        return
      }

      const groupIds = groups.map(g => g.id)
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .in('group_id', groupIds)
        .order('first_name', { ascending: true })

      if (error) throw error
      set({ children: data || [] })
    } catch (e: unknown) {
      console.error('Error fetching children for teacher:', formatSupabaseErr(e), e)
      set({ error: e instanceof Error ? e : new Error(formatSupabaseErr(e)) })
    } finally {
      set({ loading: false })
    }
  }
}))
