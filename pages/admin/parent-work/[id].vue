<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/parent-work"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Parent Work Tasks
      </NuxtLink>
      <Heading size="xl">{{ task?.title || 'Task Details' }}</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="task" class="space-y-6">
      <!-- Task Details -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{{ task.title }}</h2>
            <p class="text-gray-600 mt-1">{{ formatTaskType(task.task_type) }}</p>
          </div>
          <div class="flex gap-2">
            <NuxtLink
              :to="`/admin/parent-work/${task.id}/edit`"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Edit
            </NuxtLink>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label class="text-sm font-medium text-gray-500">Description</label>
            <p class="mt-1 text-gray-900">{{ task.description || 'No description' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500">Status</label>
            <p class="mt-1">
              <span :class="getStatusClass(task.status)">
                {{ formatStatus(task.status) }}
              </span>
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-500">Hourly Rate</label>
            <p class="mt-1 text-gray-900">€{{ task.hourly_rate.toFixed(2) }}/hr</p>
          </div>
          <div v-if="task.estimated_hours">
            <label class="text-sm font-medium text-gray-500">Estimated Hours</label>
            <p class="mt-1 text-gray-900">{{ task.estimated_hours }} hours</p>
          </div>
          <div v-if="task.assigned_to">
            <label class="text-sm font-medium text-gray-500">Assigned To</label>
            <p class="mt-1 text-gray-900">{{ getAssignedToName(task.assigned_to) }}</p>
          </div>
          <div v-if="task.due_date">
            <label class="text-sm font-medium text-gray-500">Due Date</label>
            <p class="mt-1 text-gray-900">{{ formatDate(task.due_date) }}</p>
          </div>
        </div>

        <div v-if="task.notes" class="mt-4">
          <label class="text-sm font-medium text-gray-500">Notes</label>
          <p class="mt-1 text-gray-900">{{ task.notes }}</p>
        </div>
      </div>

      <!-- Submissions -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Submissions</Heading>
        <div v-if="submissions.length === 0" class="text-center py-8 text-gray-500">
          No submissions yet
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Parent
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
              <tr v-for="submission in submissions" :key="submission.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getParentName(submission.parent_id) }}
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
                  <span :class="getSubmissionStatusClass(submission.status)">
                    {{ formatSubmissionStatus(submission.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    v-if="submission.status === 'pending'"
                    @click="approveSubmission(submission.id)"
                    class="text-green-600 hover:text-green-900 mr-4"
                  >
                    Approve
                  </button>
                  <button
                    v-if="submission.status === 'pending'"
                    @click="rejectSubmission(submission.id)"
                    class="text-red-600 hover:text-red-900 mr-4"
                  >
                    Reject
                  </button>
                  <button
                    v-if="submission.status === 'approved'"
                    @click="createPayment(submission.id)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Pay
                  </button>
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useParentWorkStore } from '~/stores/parentWork'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { ParentWorkTask, ParentWorkSubmission } from '~/stores/parentWork'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const parentWorkStore = useParentWorkStore()
const loading = ref(true)
const error = ref('')
const task = ref<ParentWorkTask | null>(null)
const submissions = ref<ParentWorkSubmission[]>([])
const profiles = ref<Record<string, string>>({})

onMounted(async () => {
  try {
    const taskId = route.params.id as string
    await Promise.all([
      loadTask(taskId),
      loadSubmissions(taskId),
      loadProfiles()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load task'
  } finally {
    loading.value = false
  }
})

const loadTask = async (taskId: string) => {
  task.value = await parentWorkStore.fetchTaskById(taskId)
  if (!task.value) {
    error.value = 'Task not found'
  }
}

const loadSubmissions = async (taskId: string) => {
  await parentWorkStore.fetchSubmissions(taskId)
  submissions.value = parentWorkStore.submissions
}

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

const formatSubmissionStatus = (status: string) => {
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
    open: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
    assigned: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    in_progress: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
    completed: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    cancelled: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
  }
  return classes[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}

const getSubmissionStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    approved: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    rejected: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
    paid: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800'
  }
  return classes[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}

const getAssignedToName = (userId?: string) => {
  if (!userId) return 'Unassigned'
  return profiles.value[userId] || userId
}

const getParentName = (userId: string) => {
  return profiles.value[userId] || userId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const approveSubmission = async (submissionId: string) => {
  if (!confirm('Approve this submission?')) return

  try {
    await parentWorkStore.approveSubmission(submissionId)
    await loadSubmissions(route.params.id as string)
    alert('Submission approved!')
  } catch (e: any) {
    alert(e.message || 'Failed to approve submission')
  }
}

const rejectSubmission = async (submissionId: string) => {
  const reason = prompt('Reason for rejection (optional):')
  if (reason === null) return

  try {
    await parentWorkStore.rejectSubmission(submissionId, reason || undefined)
    await loadSubmissions(route.params.id as string)
    alert('Submission rejected!')
  } catch (e: any) {
    alert(e.message || 'Failed to reject submission')
  }
}

const createPayment = async (submissionId: string) => {
  const submission = submissions.value.find(s => s.id === submissionId)
  if (!submission) return

  const paymentMethod = prompt('Payment method (e.g., bank transfer, cash):')
  if (!paymentMethod) return

  try {
    await parentWorkStore.createPayment({
      submission_id: submissionId,
      amount: submission.payment_amount || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      status: 'completed'
    })
    await loadSubmissions(route.params.id as string)
    alert('Payment recorded!')
  } catch (e: any) {
    alert(e.message || 'Failed to create payment')
  }
}
</script>
