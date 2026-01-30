<template>
  <div>
    <div class="page-header-fiori">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="page-header-fiori-title">User Management</h1>
          <p class="page-header-fiori-subtitle">Manage system users and their roles</p>
        </div>
        <NuxtLink to="/admin/users/new" class="btn-fiori-primary">
          ➕ Create User
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6 flex gap-2 flex-wrap">
      <button
        v-for="role in ['', 'admin', 'teacher', 'parent', 'kitchen', 'support']"
        :key="role"
        @click="selectedRole = role"
        :class="[
          'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 capitalize',
          selectedRole === role 
            ? 'bg-fiori-blue-500 text-white shadow-sm' 
            : 'bg-white text-fiori-gray-700 border border-fiori-gray-300 hover:bg-fiori-gray-50'
        ]"
      >
        {{ role || 'All' }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else>
      <EmptyState
        v-if="filteredUsers.length === 0"
        icon="👤"
        title="No users found"
        :description="selectedRole ? `No ${selectedRole} users found.` : 'Create your first user to get started.'"
      >
        <template #actions>
          <NuxtLink to="/admin/users/new" class="btn-fiori-primary">
            Create User
          </NuxtLink>
        </template>
      </EmptyState>

      <div v-else class="card-fiori overflow-hidden p-0">
        <table class="table-fiori">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="font-medium text-fiori-gray-900">
                {{ user.full_name }}
              </td>
              <td class="text-fiori-gray-600">
                {{ user.email }}
              </td>
              <td>
                <span
                  :class="[
                    'badge-fiori capitalize',
                    user.role === 'admin' ? 'badge-fiori-primary' :
                    user.role === 'teacher' ? 'badge-fiori-primary' :
                    user.role === 'parent' ? 'badge-fiori-success' :
                    user.role === 'kitchen' ? 'badge-fiori-warning' :
                    'badge-fiori-neutral'
                  ]"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="text-fiori-gray-600">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="text-right">
                <button
                  @click="editUser(user)"
                  class="text-fiori-blue-600 hover:text-fiori-blue-700 font-medium text-sm"
                >
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import EmptyState from '~/components/ui/EmptyState.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref('')
const users = ref<any[]>([])
const selectedRole = ref('')

const filteredUsers = computed(() => {
  if (!selectedRole.value) return users.value
  return users.value.filter(u => u.role === selectedRole.value)
})

onMounted(async () => {
  await fetchUsers()
})

watch(selectedRole, async () => {
  await fetchUsers()
})

const fetchUsers = async () => {
  try {
    loading.value = true
    error.value = ''
    
    let query = supabase.from('profiles').select('*')
    
    if (selectedRole.value) {
      query = query.eq('role', selectedRole.value)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error: err } = await query
    
    if (err) {
      console.error('Error fetching users:', err)
      throw err
    }
    
    console.log('Fetched users:', data?.length || 0, 'users')
    users.value = data || []
    
    if (users.value.length === 0) {
      console.log('No users found in database')
    }
  } catch (e: any) {
    console.error('Failed to load users:', e)
    error.value = e.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

const editUser = (user: any) => {
  // Navigate to edit page or open modal
  navigateTo(`/admin/users/${user.id}`)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
