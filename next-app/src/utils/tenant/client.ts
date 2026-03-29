import { createClient } from '@/utils/supabase/client'

let cachedKitaId: string | null | undefined = undefined

export async function getActiveKitaId(): Promise<string | null> {
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

