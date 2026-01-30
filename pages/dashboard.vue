<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Redirecting...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const supabase = useSupabaseClient()
const authStore = useAuthStore()

onMounted(async () => {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      await router.push('/login')
      return
    }

    // Set user and fetch profile
    authStore.setUser(session.user)
    await authStore.fetchProfile()

    // Redirect based on role
    const role = authStore.userRole
    
    if (role === 'admin') {
      await router.push('/admin/dashboard')
    } else if (role === 'teacher') {
      await router.push('/teacher/dashboard')
    } else if (role === 'parent') {
      await router.push('/parent/dashboard')
    } else if (role === 'kitchen') {
      await router.push('/kitchen/dashboard')
    } else {
      await router.push('/')
    }
  } catch (error) {
    console.error('Dashboard redirect error:', error)
    await router.push('/login')
  }
})
</script>
