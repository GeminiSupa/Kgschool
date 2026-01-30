<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/admin/users"
        class="text-gray-600 hover:text-gray-900"
      >
        ← Back to Users
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="user" class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <Heading size="xl" class="mb-6">Edit User</Heading>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            id="full_name"
            v-model="form.full_name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="kitchen">Kitchen Staff</option>
            <option value="support">Support Staff</option>
          </select>
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <NuxtLink
            to="/admin/users"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ loading ? 'Updating...' : 'Update User' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()

const user = ref<any>(null)
const loading = ref(true)
const error = ref('')

const form = ref({
  full_name: '',
  email: '',
  role: '',
  phone: ''
})

onMounted(async () => {
  try {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (err) throw err
    if (!data) {
      error.value = 'User not found'
      return
    }

    user.value = data
    form.value = {
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      phone: data.phone || ''
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load user'
  } finally {
    loading.value = false
  }
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: form.value.full_name,
        email: form.value.email,
        role: form.value.role,
        phone: form.value.phone || null
      })
      .eq('id', route.params.id)

    if (err) throw err
    await router.push('/admin/users')
  } catch (e: any) {
    error.value = e.message || 'Failed to update user'
  } finally {
    loading.value = false
  }
}
</script>
