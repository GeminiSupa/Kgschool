<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">Login</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>
      </form>

      <div class="mt-6 text-center">
        <NuxtLink to="/" class="text-blue-600 hover:text-blue-700 text-sm">
          ← Back to home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'

// Use auth layout (no sidebar/header)
definePageMeta({
  layout: 'auth'
})

const supabase = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (err) throw err

    if (!data.session) {
      throw new Error('No session returned from login')
    }

    // Wait for session to be established and persisted
    await new Promise(resolve => setTimeout(resolve, 300))

    // Verify session is actually available before redirecting
    const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession()
    
    if (verifyError || !verifySession?.user) {
      console.error('Login - Session verification failed:', verifyError)
      throw new Error('Session could not be established. Please try again.')
    }

    console.log('Login - Session verified, redirecting to callback')

    // Redirect to auth callback which handles role-based routing
    await router.push('/auth/callback')
  } catch (e: any) {
    console.error('Login error:', e)
    error.value = e.message || 'Login failed. Please try again.'
    loading.value = false
  }
}
</script>
