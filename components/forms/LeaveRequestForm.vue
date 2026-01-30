<template>
  <div class="p-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Request Leave</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label for="child_id" class="block text-sm font-medium text-gray-700 mb-2">
          Child <span class="text-red-500">*</span>
        </label>
        <select
          id="child_id"
          v-model="form.child_id"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a child</option>
          <option v-for="child in children" :key="child.id" :value="child.id">
            {{ child.first_name }} {{ child.last_name }}
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label for="start_date" class="block text-sm font-medium text-gray-700 mb-2">
            Start Date <span class="text-red-500">*</span>
          </label>
          <input
            id="start_date"
            v-model="form.start_date"
            type="date"
            required
            :min="minDate"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="end_date" class="block text-sm font-medium text-gray-700 mb-2">
            End Date <span class="text-red-500">*</span>
          </label>
          <input
            id="end_date"
            v-model="form.end_date"
            type="date"
            required
            :min="form.start_date || minDate"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div class="mb-4">
        <label for="leave_type" class="block text-sm font-medium text-gray-700 mb-2">
          Leave Type <span class="text-red-500">*</span>
        </label>
        <select
          id="leave_type"
          v-model="form.leave_type"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select type</option>
          <option value="sick">Sick</option>
          <option value="vacation">Vacation</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="mb-4">
        <label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
          Reason <span class="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          v-model="form.reason"
          rows="3"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter reason for leave request..."
        />
      </div>

      <div class="mb-4">
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          id="notes"
          v-model="form.notes"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Any additional information..."
        />
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
        {{ error }}
      </div>

      <div class="flex gap-3 justify-end">
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
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Submitting...' : 'Submit Request' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useLeaveRequestsStore } from '~/stores/leaveRequests'

const props = defineProps<{
  children: any[]
}>()

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const authStore = useAuthStore()
const leaveRequestsStore = useLeaveRequestsStore()

const form = ref({
  child_id: '',
  start_date: '',
  end_date: '',
  leave_type: '' as 'sick' | 'vacation' | 'other' | '',
  reason: '',
  notes: ''
})

const loading = ref(false)
const error = ref('')

const minDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return form.value.child_id &&
    form.value.start_date &&
    form.value.end_date &&
    form.value.leave_type &&
    form.value.reason.trim()
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  if (new Date(form.value.end_date) < new Date(form.value.start_date)) {
    error.value = 'End date must be after start date'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const requestData = {
      child_id: form.value.child_id,
      parent_id: authStore.user?.id,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      leave_type: form.value.leave_type,
      reason: form.value.reason.trim(),
      notes: form.value.notes.trim() || undefined,
      status: 'pending' as const
    }

    emit('submit', requestData)
  } catch (e: any) {
    error.value = e.message || 'Failed to submit leave request'
  } finally {
    loading.value = false
  }
}
</script>
