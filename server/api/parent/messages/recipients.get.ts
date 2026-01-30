import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        message: 'Server configuration error'
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user ID from query parameter (passed from frontend)
    const userId = getQuery(event).user_id as string
    
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'User ID required'
      })
    }

    // Get user's profile to check role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile || profile.role !== 'parent') {
      throw createError({
        statusCode: 403,
        message: 'Access denied'
      })
    }

    // For parents, they can message:
    // - Teachers (who teach their children)
    // - Admins
    // - Kitchen staff
    // - Support staff

    // First, get the parent's children
    const { data: children } = await supabaseAdmin
      .from('children')
      .select('group_id')
      .contains('parent_ids', [userId])

    const groupIds = children?.map(c => c.group_id).filter(Boolean) || []

    // Get teachers who teach the parent's children's groups
    let teacherIds: string[] = []
    if (groupIds.length > 0) {
      const { data: groups } = await supabaseAdmin
        .from('groups')
        .select('educator_id')
        .in('id', groupIds)
        .not('educator_id', 'is', null)

      teacherIds = groups?.map(g => g.educator_id).filter(Boolean) || []
    }

    // Fetch profiles: teachers, admins, kitchen, support
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role')
      .neq('id', userId)
      .in('role', ['admin', 'teacher', 'kitchen', 'support'])
      .order('full_name')

    if (error) throw error

    // Filter to only include teachers who teach the parent's children
    // and all admins, kitchen, support staff
    const filteredProfiles = profiles?.filter(p => {
      if (p.role === 'teacher') {
        return teacherIds.includes(p.id)
      }
      return true // Include all admins, kitchen, support
    }) || []

    return {
      success: true,
      profiles: filteredProfiles
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch recipients'
    })
  }
})
