<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <Heading size="xl">Parent Work (Eltern Arbeit) Management</Heading>
      <NuxtLink
        to="/admin/parent-work/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        + New Task
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-4">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 flex gap-4">
        <select
          v-model="statusFilter"
          @change="applyFilters"
          class="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          v-model="typeFilter"
          @change="applyFilters"
          class="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Types</option>
          <option value="cleaning">Cleaning</option>
          <option value="cooking">Cooking</option>
          <option value="maintenance">Maintenance</option>
          <option value="gardening">Gardening</option>
          <option value="administration">Administration</option>
          <option value="other">Other</option>
        </select>
      </div>

      <!-- Tasks List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="task in filteredTasks" :key="task.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ task.title }}</div>
                <div v-if="task.description" class="text-sm text-gray-500">
                  {{ task.description.substring(0, 50) }}...
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {{ formatTaskType(task.task_type) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                €{{ task.hourly_rate.toFixed(2) }}/hr
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getAssignedToName(task.assigned_to) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getStatusClass(task.status)
                  ]"
                >
                  {{ formatStatus(task.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <NuxtLink
                  :to="`/admin/parent-work/${task.id}`"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  View
                </NuxtLink>
                <NuxtLink
                  :to="`/admin/parent-work/${task.id}/edit`"
                  class="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Edit
                </NuxtLink>
                <button
                  @click="deleteTask(task.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredTasks.length === 0" class="text-center py-12 text-gray-500">
          No tasks found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useParentWorkStore } from '~/stores/parentWork'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { ParentWorkTask } from '~/stores/parentWork'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const parentWorkStore = useParentWorkStore()
const loading = ref(true)
const error = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const profiles = ref<Record<string, string>>({})

const filteredTasks = computed(() => {
  let tasks = parentWorkStore.tasks

  if (statusFilter.value) {
    tasks = tasks.filter(t => t.status === statusFilter.value)
  }

  if (typeFilter.value) {
    tasks = tasks.filter(t => t.task_type === typeFilter.value)
  }

  return tasks
})

const { getUserKitaId } = useKita()

onMounted(async () => {
  try {
    const kitaId = await getUserKitaId()
    await Promise.all([
      parentWorkStore.fetchTasks(undefined, undefined, kitaId || undefined),
      loadProfiles()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load tasks'
  } finally {
    loading.value = false
  }
})

const loadProfiles = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')

    if (data) {
      data.forEach(profile => {
        profiles.value[profile.id] = profile.full_name
      })
    }
  } catch (e: any) {
    console.error('Error loading profiles:', e)
  }
}

const applyFilters = () => {
  // Filters are applied via computed property
}

const formatTaskType = (type: string) => {
  const types: Record<string, string> = {
    cleaning: 'Cleaning',
    cooking: 'Cooking',
    maintenance: 'Maintenance',
    gardening: 'Gardening',
    administration: 'Administration',
    other: 'Other'
  }
  return types[type] || type
}

const formatStatus = (status: string) => {
  const statuses: Record<string, string> = {
    open: 'Open',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return statuses[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    open: 'bg-gray-100 text-gray-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getAssignedToName = (userId?: string) => {
  if (!userId) return 'Unassigned'
  return profiles.value[userId] || userId
}

const deleteTask = async (taskId: string) => {
  if (!confirm('Are you sure you want to delete this task?')) return

  try {
    const kitaId = await getUserKitaId()
    await parentWorkStore.deleteTask(taskId)
    await parentWorkStore.fetchTasks(undefined, undefined, kitaId || undefined)
  } catch (e: any) {
    alert(e.message || 'Failed to delete task')
  }
}
</script>
