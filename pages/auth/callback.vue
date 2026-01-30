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
    
    // Verify session exists and is valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Callback - Session error:', sessionError)
      await router.push('/login')
      return
    }

    const currentUser = session.user
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
      alert('Could not load your profile. Please contact administrator.')
      await router.push('/login')
      return
    }

    console.log('Callback - Profile found:', profile.role)

    // Set profile in store
    authStore.setProfile(profile)

    // CRITICAL: Ensure session is persisted in browser storage
    // Refresh session to ensure it's properly stored
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError || !refreshedSession?.user) {
      console.warn('Callback - Could not refresh session, but proceeding:', refreshError)
    }

    // Double-check session is still valid before redirect
    const { data: { session: finalCheck } } = await supabase.auth.getSession()
    if (!finalCheck?.user) {
      console.error('Callback - Session lost before redirect')
      await router.push('/login')
      return
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
