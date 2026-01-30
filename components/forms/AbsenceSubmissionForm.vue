<template>
  <div class="p-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">Submit Absence</h3>
    
    <form @submit.prevent="handleSubmit">
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
          placeholder="Enter reason for absence..."
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
          :disabled="loading || !form.reason.trim()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Submitting...' : 'Submit' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAttendanceStore } from '~/stores/attendance'

const emit = defineEmits<{
  (e: 'submit', data: { reason: string; notes?: string }): void
  (e: 'cancel'): void
}>()

const attendanceStore = useAttendanceStore()

const form = ref({
  reason: '',
  notes: ''
})

const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!form.value.reason.trim()) {
    error.value = 'Reason is required'
    return
  }

  loading.value = true
  error.value = ''

  try {
    emit('submit', {
      reason: form.value.reason.trim(),
      notes: form.value.notes.trim() || undefined
    })
  } catch (e: any) {
    error.value = e.message || 'Failed to submit absence'
  } finally {
    loading.value = false
  }
}
</script>
