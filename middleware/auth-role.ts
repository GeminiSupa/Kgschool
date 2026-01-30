// Combined auth and role middleware - runs as single middleware to avoid conflicts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const requiredRole = to.meta.role as string | string[] | undefined
  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // Always check session directly first (more reliable than reactive composable)
  let currentUser = null
  
  // If coming from callback, wait a moment for session to be established
  if (from?.path === '/auth/callback') {
    console.log('Auth-role middleware: Coming from callback, waiting for session...')
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session?.user) {
    console.log('Auth-role middleware: No session found', sessionError)
    return navigateTo('/login')
  }
  
  currentUser = session.user
  console.log('Auth-role middleware: Session found, user:', currentUser.id)

  // Update store if needed
  if (!authStore.user || authStore.user.id !== currentUser.id) {
    authStore.setUser(currentUser)
  }

  // If no role requirement, allow access
  if (!requiredRole) {
    return
  }

  // Try to get role from store first (faster)
  let userRole = authStore.profile?.role

  // If not in store or user ID doesn't match, fetch from database
  if (!userRole || authStore.profile?.id !== currentUser.id) {
    console.log('Auth-role middleware: Fetching profile from database...')
    
    // Try fetching profile with retry logic
    let profile = null
    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (!error && data?.role) {
        profile = data
        break
      }

      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    }

    if (!profile?.role) {
      console.error('Auth-role middleware: No role found for user', currentUser.id)
      // If coming from callback, let it handle the redirect
      if (from?.path === '/auth/callback') {
        console.log('Auth-role middleware: Coming from callback, allowing through')
        return
      }
      return navigateTo('/unauthorized')
    }

    userRole = profile.role
    console.log('Auth-role middleware: Role found:', userRole)

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
    console.log('Auth-role middleware: Role mismatch', userRole, 'not in', allowedRoles)
    return navigateTo('/unauthorized')
  }

  // Access granted
  console.log('Auth-role middleware: Access granted for', userRole)
})
