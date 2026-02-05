import { useAuthStore } from '~/stores/auth'

/**
 * Composable to get user's kita_id and helper functions for multi-tenant queries
 */
export const useKita = () => {
  const authStore = useAuthStore()
  const supabase = useSupabaseClient()

  /**
   * Get user's kita_id from organization_members
   */
  const getUserKitaId = async (): Promise<string | null> => {
    if (!authStore.user?.id) return null

    try {
      // Use a simpler query that Supabase accepts better
      const { data, error } = await supabase
        .from('organization_members')
        .select('kita_id')
        .eq('profile_id', authStore.user.id)
        .limit(1)

      if (error) {
        console.error('Error fetching kita_id:', error)
        return null
      }

      // Filter out null kita_id values in JavaScript
      const member = data?.find(m => m.kita_id !== null)
      return member?.kita_id || null
    } catch (e: any) {
      console.error('Error in getUserKitaId:', e)
      return null
    }
  }

  /**
   * Get user's kita_id synchronously from profile (if cached)
   */
  const getCachedKitaId = (): string | null => {
    return authStore.profile?.default_kita_id || null
  }

  /**
   * Add kita_id filter to a query
   */
  const addKitaFilter = async (query: any, tableName: string) => {
    const kitaId = await getUserKitaId()
    
    if (kitaId) {
      // Add kita_id filter based on table
      if (tableName === 'children' || tableName === 'groups') {
        return query.eq('kita_id', kitaId)
      } else if (tableName === 'attendance') {
        // For attendance, we need to join with children
        // This is handled differently - see addKitaFilterToAttendance
        return query
      }
    }
    
    return query
  }

  /**
   * Filter children by kita_id
   */
  const filterChildrenByKita = async (children: any[]): Promise<any[]> => {
    const kitaId = await getUserKitaId()
    if (!kitaId) return children

    return children.filter(child => child.kita_id === kitaId)
  }

  /**
   * Filter groups by kita_id
   */
  const filterGroupsByKita = async (groups: any[]): Promise<any[]> => {
    const kitaId = await getUserKitaId()
    if (!kitaId) return groups

    return groups.filter(group => group.kita_id === kitaId)
  }

  /**
   * Check if user belongs to kita
   */
  const userBelongsToKita = async (kitaId: string): Promise<boolean> => {
    if (!authStore.user?.id) return false

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('profile_id', authStore.user.id)
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
