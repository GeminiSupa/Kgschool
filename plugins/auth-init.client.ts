export default defineNuxtPlugin(async () => {
  const user = useSupabaseUser()
  const authStore = useAuthStore()

  // Initialize store from session on app start
  if (user.value?.id) {
    const supabase = useSupabaseClient()
    
    // Wait a moment for session to be fully established
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Set user if not already set
    if (!authStore.user || authStore.user.id !== user.value.id) {
      authStore.setUser(user.value)
    }
    
    // Always try to fetch profile if missing or doesn't match user or missing role
    if (!authStore.profile || authStore.profile.id !== user.value.id || !authStore.profile.role) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.value.id)
          .single()

        if (profile && !error) {
          console.log('Auth plugin: Profile loaded', { role: profile.role, id: profile.id })
          authStore.setProfile(profile)
        } else if (error) {
          console.error('Auth plugin: Error fetching profile', error)
          // Retry once after a delay
          setTimeout(async () => {
            try {
              await authStore.fetchProfile()
            } catch (e) {
              console.error('Auth plugin: Retry failed', e)
            }
          }, 500)
        }
      } catch (e) {
        console.error('Auth plugin: Could not fetch profile on init', e)
      }
    }
  }

  // Watch for user changes
  watch(user, async (newUser, oldUser) => {
    if (newUser?.id) {
      if (!authStore.user || authStore.user.id !== newUser.id) {
        authStore.setUser(newUser)
        
        // Fetch profile for new user
        const supabase = useSupabaseClient()
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newUser.id)
            .single()

          if (profile && !error) {
            console.log('Auth plugin: Profile loaded for new user', { role: profile.role })
            authStore.setProfile(profile)
          } else if (error) {
            console.error('Auth plugin: Error fetching profile for new user', error)
            // Retry
            setTimeout(async () => {
              await authStore.fetchProfile()
            }, 500)
          }
        } catch (e) {
          console.error('Auth plugin: Error in watch handler', e)
        }
      }
    } else if (!newUser && oldUser) {
      // User logged out
      authStore.setUser(null)
      authStore.setProfile(null)
    }
  }, { immediate: true })
})
