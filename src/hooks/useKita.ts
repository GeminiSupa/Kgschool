import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/utils/supabase/client'

export const useKita = () => {
  const { user, profile } = useAuthStore()
  const supabase = createClient()

  const getUserKitaId = async (): Promise<string | null> => {
    if (!user?.id) return null

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('kita_id')
        .eq('profile_id', user.id)
        .limit(1)

      if (error) {
        console.error('Error fetching kita_id from organization_members:', error)
        return null
      }

      const member = data?.find(m => m.kita_id !== null)
      return member?.kita_id || null
    } catch (e: any) {
      console.error('Error in getUserKitaId:', e)
      return null
    }
  }

  const getCachedKitaId = (): string | null => {
    // Note: Assuming profile might be extended with default_kita_id, 
    // otherwise this relies on fetching or another store
    return (profile as any)?.default_kita_id || null
  }

  const addKitaFilter = async (query: any, tableName: string) => {
    const kitaId = await getUserKitaId()
    
    if (kitaId) {
      if (tableName === 'children' || tableName === 'groups') {
        return query.eq('kita_id', kitaId)
      } else if (tableName === 'attendance') {
        return query
      }
    }
    return query
  }

  const filterChildrenByKita = async (children: any[]): Promise<any[]> => {
    const kitaId = await getUserKitaId()
    if (!kitaId) return children
    return children.filter(child => child.kita_id === kitaId)
  }

  const filterGroupsByKita = async (groups: any[]): Promise<any[]> => {
    const kitaId = await getUserKitaId()
    if (!kitaId) return groups
    return groups.filter(group => group.kita_id === kitaId)
  }

  const userBelongsToKita = async (kitaId: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('profile_id', user.id)
        .eq('kita_id', kitaId)
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking kita membership:', error)
        return false
      }

      return !!data
    } catch (e: any) {
      console.error('Error in userBelongsToKita:', e)
      return false
    }
  }

  return {
    getUserKitaId,
    getCachedKitaId,
    addKitaFilter,
    filterChildrenByKita,
    filterGroupsByKita,
    userBelongsToKita
  }
}
