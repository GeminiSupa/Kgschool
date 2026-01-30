export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check for login, signup, and callback pages
  if (to.path === '/login' || to.path === '/signup' || to.path === '/auth/callback') {
    return
  }

  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // Always check the current session directly (more reliable than reactive user)
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.user) {
    // No valid session → send to login
    console.log('Auth middleware: No session found, redirecting to login')
    return navigateTo('/login')
  }

  // Keep Pinia auth store in sync for components
  if (!authStore.user || authStore.user.id !== session.user.id) {
    authStore.setUser(session.user)
    
    // Try to fetch profile if not already loaded
    if (!authStore.profile || authStore.profile.id !== session.user.id) {
      try {
        await authStore.fetchProfile()
      } catch (e) {
        // Silent fail - profile might be fetched elsewhere
        console.log('Auth middleware: Could not fetch profile', e)
      }
    }
  }

  // Allow navigation to proceed
})
