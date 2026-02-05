<template>
  <div>
    <div class="mb-6">
      <Heading size="xl">Parent Work (Eltern Arbeit)</Heading>
      <p class="text-gray-600 mt-2">
        View available tasks and submit your work for payment
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600">Total Earnings</div>
          <div class="text-2xl font-bold text-gray-900 mt-2">
            €{{ totalEarnings.toFixed(2) }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600">Pending Submissions</div>
          <div class="text-2xl font-bold text-yellow-600 mt-2">
            {{ pendingSubmissions.length }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600">Approved & Paid</div>
          <div class="text-2xl font-bold text-green-600 mt-2">
            {{ paidSubmissions.length }}
          </div>
        </div>
      </div>

      <!-- Available Tasks -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Available Tasks</Heading>
        <div v-if="availableTasks.length === 0" class="text-center py-8 text-gray-500">
          No available tasks at the moment
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="task in availableTasks"
            :key="task.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">{{ task.title }}</h3>
                <p v-if="task.description" class="text-sm text-gray-600 mt-1">
                  {{ task.description }}
                </p>
                <div class="flex gap-4 mt-3">
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {{ formatTaskType(task.task_type) }}
                  </span>
                  <span class="text-sm text-gray-600">
                    €{{ task.hourly_rate.toFixed(2) }}/hr
                  </span>
                  <span v-if="task.estimated_hours" class="text-sm text-gray-600">
                    ~{{ task.estimated_hours }} hours
                  </span>
                </div>
              </div>
              <NuxtLink
                :to="`/parent/work/tasks/${task.id}`"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Details
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- My Submissions -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">My Submissions</Heading>
        <div v-if="mySubmissions.length === 0" class="text-center py-8 text-gray-500">
          You haven't submitted any work yet
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Task
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hours
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="submission in mySubmissions" :key="submission.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getTaskTitle(submission.task_id) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(submission.work_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ submission.hours_worked }}h
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  €{{ (submission.payment_amount || 0).toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(submission.status)">
                    {{ formatStatus(submission.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <NuxtLink
                    :to="`/parent/work/submissions/${submission.id}`"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useParentWorkStore } from '~/stores/parentWork'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { ParentWorkTask, ParentWorkSubmission } from '~/stores/parentWork'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const parentWorkStore = useParentWorkStore()
const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const tasks = ref<ParentWorkTask[]>([])
const taskMap = ref<Record<string, ParentWorkTask>>({})

const availableTasks = computed(() => {
  return tasks.value.filter(
    t => t.status === 'open' || (t.status === 'assigned' && t.assigned_to === authStore.user?.id)
  )
})

const mySubmissions = computed(() => {
  return parentWorkStore.submissions
})

const pendingSubmissions = computed(() => {
  return mySubmissions.value.filter(s => s.status === 'pending')
})

const paidSubmissions = computed(() => {
  return mySubmissions.value.filter(s => s.status === 'paid')
})

const totalEarnings = ref(0)

onMounted(async () => {
  try {
    await Promise.all([
      loadTasks(),
      parentWorkStore.fetchSubmissions(undefined, authStore.user?.id),
      loadTotalEarnings()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
})

const loadTasks = async () => {
  try {
    await parentWorkStore.fetchTasks()
    tasks.value = parentWorkStore.tasks
    parentWorkStore.tasks.forEach(task => {
      taskMap.value[task.id] = task
    })
  } catch (e: any) {
    console.error('Error loading tasks:', e)
  }
}

const loadTotalEarnings = async () => {
  if (!authStore.user?.id) return
  try {
    totalEarnings.value = await parentWorkStore.getTotalEarnings(authStore.user.id)
  } catch (e: any) {
    console.error('Error loading total earnings:', e)
  }
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
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid'
  }
  return statuses[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    approved: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    rejected: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
    paid: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800'
  }
  return classes[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}

const getTaskTitle = (taskId: string) => {
  return taskMap.value[taskId]?.title || taskId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
