export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check for login, signup, and callback pages
  if (to.path === '/login' || to.path === '/signup' || to.path === '/auth/callback') {
    return
  }

  const supabase = useSupabaseClient()
  const authStore = useAuthStore()

  // Use getUser() instead of getSession() for security (authenticates with server)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    // No valid user → send to login
    console.log('Auth middleware: No user found, redirecting to login')
    return navigateTo('/login')
  }

  // Keep Pinia auth store in sync for components
  if (!authStore.user || authStore.user.id !== user.id) {
    authStore.setUser(user)
    
    // Try to fetch profile if not already loaded
    if (!authStore.profile || authStore.profile.id !== user.id) {
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
