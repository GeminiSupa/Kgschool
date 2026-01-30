<template>
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
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      />
    </div>

    <div v-if="!isEdit" class="space-y-4">
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
          placeholder="Minimum 6 characters"
        />
        <p class="text-xs text-gray-500 mt-1">
          Password must be at least 6 characters long
        </p>
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
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Re-enter password"
        />
        <p v-if="form.password_confirm && form.password !== form.password_confirm" class="text-xs text-red-600 mt-1">
          Passwords do not match
        </p>
      </div>
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
        <option value="teacher">Teacher</option>
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
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
      {{ error }}
    </div>

    <div class="flex gap-3 justify-end pt-4">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="loading || !isFormValid"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Staff } from '~/stores/staff'

interface Props {
  staff?: Staff
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const isEdit = computed(() => !!props.staff)
const loading = ref(false)
const error = ref('')

const form = ref({
  full_name: props.staff?.full_name || '',
  email: props.staff?.email || '',
  password: '',
  password_confirm: '',
  role: props.staff?.role || '',
  phone: props.staff?.phone || ''
})

const isFormValid = computed(() => {
  if (!form.value.full_name || !form.value.email || !form.value.role) {
    return false
  }
  if (!isEdit.value) {
    if (!form.value.password || form.value.password.length < 6) {
      return false
    }
    if (form.value.password !== form.value.password_confirm) {
      return false
    }
  }
  return true
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields correctly'
    return
  }

  if (!isEdit.value && form.value.password !== form.value.password_confirm) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Remove password_confirm from submission
    const submitData = { ...form.value }
    if (isEdit.value) {
      delete submitData.password
      delete submitData.password_confirm
    } else {
      delete submitData.password_confirm
    }
    emit('submit', submitData)
  } catch (e: any) {
    error.value = e.message || 'Failed to save staff member'
  } finally {
    loading.value = false
  }
}
</script>
