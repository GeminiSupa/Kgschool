<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Create New Parent</h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label for="password_confirm" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              id="password_confirm"
              v-model="form.password_confirm"
              type="password"
              required
              minlength="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p v-if="form.password_confirm && form.password !== form.password_confirm" class="text-xs text-red-600 mt-1">
              Passwords do not match
            </p>
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {{ error }}
          </div>

          <div class="flex gap-3 justify-end pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Creating...' : 'Create Parent' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  close: []
  created: [parent: any]
}>()

const loading = ref(false)
const error = ref('')

const form = ref({
  full_name: '',
  email: '',
  password: '',
  password_confirm: '',
  phone: '',
  role: 'parent'
})

const isFormValid = computed(() => {
  return form.value.full_name &&
    form.value.email &&
    form.value.password &&
    form.value.password.length >= 6 &&
    form.value.password === form.value.password_confirm
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields correctly'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/admin/users/create', {
      method: 'POST',
      body: {
        full_name: form.value.full_name,
        email: form.value.email,
        password: form.value.password,
        role: 'parent',
        phone: form.value.phone || null
      }
    })

    if (response.success) {
      // Fetch the created parent profile
      const supabase = useSupabaseClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', response.user.id)
        .single()

      emit('created', data)
    }
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to create parent'
  } finally {
    loading.value = false
  }
}
</script>
