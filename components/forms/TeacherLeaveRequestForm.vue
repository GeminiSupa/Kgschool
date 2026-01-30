<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
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
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div>
      <label for="leave_type" class="block text-sm font-medium text-gray-700 mb-2">
        Leave Type <span class="text-red-500">*</span>
      </label>
      <select
        id="leave_type"
        v-model="form.leave_type"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="vacation">Vacation</option>
        <option value="sick">Sick Leave</option>
        <option value="personal">Personal</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div>
      <label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
        Reason <span class="text-red-500">*</span>
      </label>
      <textarea
        id="reason"
        v-model="form.reason"
        required
        rows="4"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Please provide a reason for your leave request..."
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
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Submitting...' : 'Submit Request' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  initialData?: any
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined
})

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const loading = ref(false)
const error = ref('')

const minDate = new Date().toISOString().split('T')[0]

const form = ref({
  start_date: props.initialData?.start_date || '',
  end_date: props.initialData?.end_date || '',
  leave_type: props.initialData?.leave_type || 'vacation',
  reason: props.initialData?.reason || ''
})

const isFormValid = computed(() => {
  return form.value.start_date &&
    form.value.end_date &&
    form.value.leave_type &&
    form.value.reason.trim() &&
    new Date(form.value.end_date) >= new Date(form.value.start_date)
})

const handleSubmit = () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields and ensure end date is after start date'
    return
  }

  loading.value = true
  error.value = ''

  emit('submit', {
    ...form.value
  })
}
</script>
