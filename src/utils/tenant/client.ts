import { createClient } from '@/utils/supabase/client'

let cachedKitaId: string | null | undefined = undefined

export async function getActiveKitaId(): Promise<string | null> {
  // Always re-check profile first so hydration can populate kita after a prior null cache.
  try {
    const { useAuthStore } = await import('@/stores/auth')
    const p = useAuthStore.getState().profile
    const fromProfile = p?.kita_id ?? p?.default_kita_id
    if (fromProfile) {
      cachedKitaId = fromProfile
      return fromProfile
    }
  } catch {
    // ignore (e.g. rare circular init)
  }

  if (cachedKitaId !== undefined) return cachedKitaId

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    cachedKitaId = null
    return null
  }

  const { data, error } = await supabase
    .from('organization_members')
    .select('kita_id')
    .eq('profile_id', user.id)
    .not('kita_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (error) {
    cachedKitaId = null
    return null
  }

  cachedKitaId = (data?.kita_id as string | null) || null
  return cachedKitaId
}

export function clearCachedKitaId() {
  cachedKitaId = undefined
}

