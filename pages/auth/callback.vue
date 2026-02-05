<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: []
})

const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const authStore = useAuthStore()

onMounted(async () => {
  try {
    // Wait for session to be fully established - give Supabase time to persist
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Use getUser() instead of getSession() for security (authenticates with server)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Callback - User error:', userError)
      await router.push('/login')
      return
    }

    const currentUser = user
    console.log('Callback - User found:', currentUser.id)

    // Set user in store immediately
    authStore.setUser(currentUser)

    // Fetch profile with retry logic
    let profile = null
    let profileError = null
    
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (!error && data) {
        profile = data
        break
      }
      
      profileError = error
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    if (!profile) {
      console.error('Callback - Profile error after retries:', profileError)
      // Try to create a basic profile if it doesn't exist
      try {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.email?.split('@')[0] || 'User',
            role: 'parent' // Default role
          })
          .select()
          .single()

        if (!createError && newProfile) {
          profile = newProfile
          console.log('Callback - Created default profile')
        } else {
          throw createError || new Error('Failed to create profile')
        }
      } catch (createErr) {
        console.error('Callback - Could not create profile:', createErr)
        alert('Could not load your profile. Please contact administrator.')
        await router.push('/login')
        return
      }
    }

    console.log('Callback - Profile found:', profile.role)

    // Set profile in store
    authStore.setProfile(profile)

    // Verify user is still authenticated using getUser() (more secure than getSession)
    const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()
    
    if (verifyError || !verifiedUser) {
      console.error('Callback - User verification failed:', verifyError)
      await router.push('/login')
      return
    }

    // Only refresh session if we have a valid session to refresh
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.refresh_token) {
        // Only refresh if we have a refresh token
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          // Log but don't fail - session might still be valid
          console.warn('Callback - Could not refresh session:', refreshError.message)
        }
      }
    } catch (refreshErr) {
      // Silently handle refresh errors - session might still be valid
      console.warn('Callback - Session refresh error (non-critical):', refreshErr)
    }

    // Get role
    const role = profile.role

    console.log('Callback - Redirecting to:', role, 'dashboard')

    // Use window.location.href for a hard redirect to ensure session is read fresh
    // This avoids any client-side routing issues with session persistence
    if (role === 'admin') {
      window.location.href = '/admin/dashboard'
    } else if (role === 'teacher') {
      window.location.href = '/teacher/dashboard'
    } else if (role === 'parent') {
      window.location.href = '/parent/dashboard'
    } else if (role === 'kitchen') {
      window.location.href = '/kitchen/dashboard'
    } else {
      await router.push('/login')
    }
  } catch (error) {
    console.error('Callback error:', error)
    await router.push('/login')
  }
})
</script>
