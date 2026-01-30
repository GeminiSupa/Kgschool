export default defineNuxtRouteMiddleware(async (to, from) => {
  const requiredRole = to.meta.role as string | string[] | undefined
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // No role requirement - allow access
  if (!requiredRole) {
    return
  }

  // Check session directly (more reliable than reactive composable)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session?.user) {
    console.log('Role middleware: No session found')
    return navigateTo('/login')
  }

  const currentUser = session.user

  // Update store if needed
  if (!authStore.user || authStore.user.id !== currentUser.id) {
    authStore.setUser(currentUser)
  }
  
  // Get role from store or fetch it
  let userRole = authStore.profile?.role

  // If no role in store or user ID doesn't match, fetch it from database
  if (!userRole || authStore.profile?.id !== currentUser.id) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (error || !profile?.role) {
      console.error('Role middleware - No role found:', error)
      return navigateTo('/unauthorized')
    }

    userRole = profile.role
    
    // Update store
    if (!authStore.profile || authStore.profile.id !== currentUser.id) {
      authStore.setProfile({
        id: currentUser.id,
        role: userRole as any,
        full_name: '',
        email: currentUser.email || '',
        created_at: '',
        updated_at: ''
      })
    }
  }

  // Check role matches
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  
  if (!allowedRoles.includes(userRole)) {
    console.log('Role middleware: Role mismatch', userRole, 'not in', allowedRoles)
    return navigateTo('/unauthorized')
  }

  // Access granted
  console.log('Role middleware: Access granted for', userRole)
})
