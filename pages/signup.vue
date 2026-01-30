<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">Sign Up</h1>
      
      <form @submit.prevent="handleSignup" class="space-y-4">
        <div>
          <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            id="full_name"
            v-model="form.full_name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password (min 6 characters)"
          />
        </div>

        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            v-model="form.role"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a role</option>
            <option value="parent">Parent</option>
            <option value="teacher">Teacher</option>
            <option value="kitchen">Kitchen</option>
          </select>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Creating account...' : 'Sign Up' }}
        </button>

        <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <div v-if="success" class="p-3 bg-green-50 text-green-700 rounded-md text-sm">
          Account created! Please check your email to confirm your account, then you can log in.
        </div>
      </form>

      <div class="mt-6 text-center">
        <NuxtLink to="/login" class="text-blue-600 hover:text-blue-700 text-sm">
          Already have an account? Login
        </NuxtLink>
      </div>

      <div class="mt-4 text-center">
        <NuxtLink to="/" class="text-gray-600 hover:text-gray-700 text-sm">
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

const form = ref({
  full_name: '',
  email: '',
  password: '',
  role: 'parent'
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleSignup = async () => {
  loading.value = true
  error.value = ''
  success.value = false

  try {
    const { data, error: err } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password,
      options: {
        data: {
          full_name: form.value.full_name,
          role: form.value.role
        }
      }
    })

    if (err) throw err

    success.value = true
    form.value = { full_name: '', email: '', password: '', role: 'parent' }

    // Optionally redirect to login after a delay
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (e: any) {
    error.value = e.message || 'Sign up failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
