<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/parent/work"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Parent Work
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
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-500">Description</label>
            <p class="mt-1 text-gray-900">{{ task.description || 'No description' }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500">Task Type</label>
              <p class="mt-1 text-gray-900">{{ formatTaskType(task.task_type) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500">Hourly Rate</label>
              <p class="mt-1 text-gray-900">€{{ task.hourly_rate.toFixed(2) }}/hr</p>
            </div>
            <div v-if="task.estimated_hours">
              <label class="text-sm font-medium text-gray-500">Estimated Hours</label>
              <p class="mt-1 text-gray-900">{{ task.estimated_hours }} hours</p>
            </div>
            <div v-if="task.due_date">
              <label class="text-sm font-medium text-gray-500">Due Date</label>
              <p class="mt-1 text-gray-900">{{ formatDate(task.due_date) }}</p>
            </div>
          </div>
          <div v-if="task.notes">
            <label class="text-sm font-medium text-gray-500">Notes</label>
            <p class="mt-1 text-gray-900">{{ task.notes }}</p>
          </div>
        </div>
      </div>

      <!-- Submit Work Form -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Submit Work</Heading>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="work_date" class="block text-sm font-medium text-gray-700 mb-2">
              Work Date <span class="text-red-500">*</span>
            </label>
            <input
              id="work_date"
              v-model="form.work_date"
              type="date"
              required
              :max="new Date().toISOString().split('T')[0]"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="hours_worked" class="block text-sm font-medium text-gray-700 mb-2">
              Hours Worked <span class="text-red-500">*</span>
            </label>
            <input
              id="hours_worked"
              v-model.number="form.hours_worked"
              type="number"
              step="0.5"
              min="0.5"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Estimated payment: €{{ estimatedPayment.toFixed(2) }}
            </p>
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Work Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the work you performed..."
            />
          </div>

          <div v-if="submitError" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {{ submitError }}
          </div>

          <div class="flex gap-3 justify-end pt-4">
            <NuxtLink
              to="/parent/work"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </NuxtLink>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {{ loading ? 'Submitting...' : 'Submit Work' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useParentWorkStore } from '~/stores/parentWork'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { ParentWorkTask } from '~/stores/parentWork'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const route = useRoute()
const router = useRouter()
const parentWorkStore = useParentWorkStore()
const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const submitError = ref('')
const task = ref<ParentWorkTask | null>(null)

const form = ref({
  work_date: new Date().toISOString().split('T')[0],
  hours_worked: 0,
  description: ''
})

const estimatedPayment = computed(() => {
  if (!task.value || !form.value.hours_worked) return 0
  return task.value.hourly_rate * form.value.hours_worked
})

const isFormValid = computed(() => {
  return form.value.work_date && form.value.hours_worked > 0
})

onMounted(async () => {
  try {
    const taskId = route.params.id as string
    task.value = await parentWorkStore.fetchTaskById(taskId)
    if (!task.value) {
      error.value = 'Task not found'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load task'
  } finally {
    loading.value = false
  }
})

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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const handleSubmit = async () => {
  if (!task.value || !authStore.user?.id) return

  loading.value = true
  submitError.value = ''

  try {
    await parentWorkStore.createSubmission({
      task_id: task.value.id,
      parent_id: authStore.user.id,
      work_date: form.value.work_date,
      hours_worked: form.value.hours_worked,
      description: form.value.description
    })

    alert('Work submitted successfully! It will be reviewed by admin.')
    router.push('/parent/work')
  } catch (e: any) {
    submitError.value = e.message || 'Failed to submit work'
  } finally {
    loading.value = false
  }
}
</script>
