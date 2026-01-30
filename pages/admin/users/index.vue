<template>
  <div>
    <div class="ios-page-header">
      <div class="flex justify-between items-center">
        <div>
          <h1>Benutzerverwaltung</h1>
          <p>Systembenutzer und deren Rollen verwalten</p>
        </div>
        <NuxtLink to="/admin/users/new" class="ios-button ios-button-primary inline-flex items-center gap-2">
          ➕ Benutzer erstellen
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6 flex gap-2 flex-wrap">
      <button
        v-for="role in ['', 'admin', 'teacher', 'parent', 'kitchen', 'support']"
        :key="role"
        @click="selectedRole = role"
        :class="[
          'ios-button transition-all duration-200 capitalize',
          selectedRole === role 
            ? 'ios-button-primary' 
            : 'ios-button-secondary'
        ]"
      >
        {{ role || 'Alle' }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else>
      <div v-if="filteredUsers.length === 0">
        <IOSCard customClass="p-8 text-center">
          <div class="text-6xl mb-4 opacity-50">👤</div>
          <p class="text-lg font-semibold text-gray-900 mb-2">Keine Benutzer gefunden</p>
          <p class="text-sm text-gray-600 mb-4">
            {{ selectedRole ? `Keine ${selectedRole}-Benutzer gefunden.` : 'Erstellen Sie Ihren ersten Benutzer, um zu beginnen.' }}
          </p>
          <NuxtLink to="/admin/users/new" class="ios-button ios-button-primary inline-flex items-center gap-2">
            Benutzer erstellen
          </NuxtLink>
        </IOSCard>
      </div>

      <div v-else>
        <IOSCard customClass="overflow-hidden p-0">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="ios-glass">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rolle</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Erstellt</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Aktionen</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    {{ user.full_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ user.email }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'px-3 py-1 text-xs font-semibold rounded-full capitalize',
                        user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'parent' ? 'bg-green-100 text-green-800' :
                        user.role === 'kitchen' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      ]"
                    >
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ formatDate(user.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="editUser(user)"
                      class="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </IOSCard>
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
import IOSCard from '~/components/ui/IOSCard.vue'

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
