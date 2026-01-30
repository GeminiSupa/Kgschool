<template>
  <div>
    <div class="page-header-fiori mb-6">
      <NuxtLink
        to="/admin/users"
        class="text-sm text-fiori-blue-600 hover:text-fiori-blue-700 mb-2 inline-block"
      >
        ← Back to Users
      </NuxtLink>
      <h1 class="page-header-fiori-title">Create New User</h1>
      <p class="page-header-fiori-subtitle">Add a new user to the system</p>
    </div>
    
    <Card title="User Information" class="max-w-2xl">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="form-group-fiori">
          <label for="full_name" class="form-label-fiori form-label-fiori-required">
            Full Name
          </label>
          <input
            id="full_name"
            v-model="form.full_name"
            type="text"
            required
            class="input-fiori"
            placeholder="Enter full name"
          />
        </div>

        <div class="form-group-fiori">
          <label for="email" class="form-label-fiori form-label-fiori-required">
            Email
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="input-fiori"
            placeholder="user@example.com"
          />
        </div>

        <div class="form-group-fiori">
          <label for="password" class="form-label-fiori form-label-fiori-required">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="input-fiori"
            placeholder="Minimum 6 characters"
          />
          <p class="form-help-fiori">Password must be at least 6 characters long</p>
        </div>

        <div class="form-group-fiori">
          <label for="role" class="form-label-fiori form-label-fiori-required">
            Role
          </label>
          <select
            id="role"
            v-model="form.role"
            required
            class="input-fiori"
          >
            <option value="">Select a role</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="kitchen">Kitchen Staff</option>
            <option value="support">Support Staff</option>
          </select>
        </div>

        <div class="form-group-fiori">
          <label for="phone" class="form-label-fiori">
            Phone
          </label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            class="input-fiori"
            placeholder="+49 123 456 7890"
          />
        </div>

        <div v-if="error" class="alert-fiori alert-fiori-error">
          {{ error }}
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t border-fiori-gray-200">
          <NuxtLink to="/admin/users" class="btn-fiori-secondary">
            Cancel
          </NuxtLink>
          <Button
            type="submit"
            :disabled="loading"
            :loading="loading"
            variant="primary"
          >
            Create User
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const loading = ref(false)
const error = ref('')

const form = ref({
  full_name: '',
  email: '',
  password: '',
  role: '',
  phone: ''
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/admin/users/create', {
      method: 'POST',
      body: form.value
    })

    if (response.success) {
      await router.push('/admin/users')
    }
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to create user'
  } finally {
    loading.value = false
  }
}
</script>
