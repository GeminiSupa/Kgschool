<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="base_salary" class="block text-sm font-medium text-gray-700 mb-2">
        Base Salary (€) <span class="text-red-500">*</span>
      </label>
      <input
        id="base_salary"
        v-model.number="form.base_salary"
        type="number"
        step="0.01"
        required
        min="0"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="hourly_rate" class="block text-sm font-medium text-gray-700 mb-2">
        Hourly Rate (€)
      </label>
      <input
        id="hourly_rate"
        v-model.number="form.hourly_rate"
        type="number"
        step="0.01"
        min="0"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="overtime_multiplier" class="block text-sm font-medium text-gray-700 mb-2">
        Overtime Multiplier
      </label>
      <input
        id="overtime_multiplier"
        v-model.number="form.overtime_multiplier"
        type="number"
        step="0.1"
        min="1"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">Default: 1.5 (time and a half)</p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="effective_from" class="block text-sm font-medium text-gray-700 mb-2">
          Effective From <span class="text-red-500">*</span>
        </label>
        <input
          id="effective_from"
          v-model="form.effective_from"
          type="date"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="effective_to" class="block text-sm font-medium text-gray-700 mb-2">
          Effective To (Optional)
        </label>
        <input
          id="effective_to"
          v-model="form.effective_to"
          type="date"
          :min="form.effective_from"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div>
      <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
        Notes
      </label>
      <textarea
        id="notes"
        v-model="form.notes"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Additional notes about this salary configuration..."
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
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Saving...' : 'Save Configuration' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SalaryConfig } from '~/stores/salaryConfig'

interface Props {
  staffId?: string
  initialData?: SalaryConfig
}

const props = withDefaults(defineProps<Props>(), {
  staffId: undefined,
  initialData: undefined
})

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const loading = ref(false)
const error = ref('')

const form = ref({
  staff_id: props.staffId || props.initialData?.staff_id || '',
  base_salary: props.initialData?.base_salary || 0,
  hourly_rate: props.initialData?.hourly_rate || undefined,
  overtime_multiplier: props.initialData?.overtime_multiplier || 1.5,
  effective_from: props.initialData?.effective_from || new Date().toISOString().split('T')[0],
  effective_to: props.initialData?.effective_to || undefined,
  notes: props.initialData?.notes || ''
})

const handleSubmit = () => {
  loading.value = true
  error.value = ''

  const submitData: any = {
    ...form.value
  }

  if (!submitData.effective_to) {
    delete submitData.effective_to
  }

  if (!submitData.hourly_rate) {
    delete submitData.hourly_rate
  }

  emit('submit', submitData)
}
</script>
