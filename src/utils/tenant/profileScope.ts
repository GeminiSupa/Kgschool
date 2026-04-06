import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Profile IDs that belong to a Kita:
 * - organization_members for that kita
 * - parents listed on children rows in that kita
 */
export async function getProfileIdsForKita(supabase: SupabaseClient, kitaId: string): Promise<string[]> {
  const ids = new Set<string>()

  const { data: members, error: mErr } = await supabase
    .from('organization_members')
    .select('profile_id')
    .eq('kita_id', kitaId)

  if (mErr) throw mErr
  for (const m of members ?? []) {
    if (m.profile_id) ids.add(m.profile_id as string)
  }

  const { data: children, error: cErr } = await supabase.from('children').select('parent_ids').eq('kita_id', kitaId)

  if (cErr) throw cErr
  for (const c of children ?? []) {
    const pids = c.parent_ids as string[] | null | undefined
    if (!pids) continue
    for (const pid of pids) ids.add(pid)
  }

  return [...ids]
}
