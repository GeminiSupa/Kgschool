<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="month" class="block text-sm font-medium text-gray-700 mb-2">
          Month <span class="text-red-500">*</span>
        </label>
        <select
          id="month"
          v-model.number="form.month"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="m in 12" :key="m" :value="m">
            {{ getMonthName(m) }}
          </option>
        </select>
      </div>

      <div>
        <label for="year" class="block text-sm font-medium text-gray-700 mb-2">
          Year <span class="text-red-500">*</span>
        </label>
        <input
          id="year"
          v-model.number="form.year"
          type="number"
          required
          :min="2020"
          :max="2100"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
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
        <label for="overtime_hours" class="block text-sm font-medium text-gray-700 mb-2">
          Overtime Hours
        </label>
        <input
          id="overtime_hours"
          v-model.number="form.overtime_hours"
          type="number"
          step="0.5"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="overtime_rate" class="block text-sm font-medium text-gray-700 mb-2">
          Overtime Rate (€/hour)
        </label>
        <input
          id="overtime_rate"
          v-model.number="form.overtime_rate"
          type="number"
          step="0.01"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="overtime_amount" class="block text-sm font-medium text-gray-700 mb-2">
          Overtime Amount (€)
        </label>
        <input
          id="overtime_amount"
          v-model.number="form.overtime_amount"
          type="number"
          step="0.01"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="bonuses" class="block text-sm font-medium text-gray-700 mb-2">
          Bonuses (€)
        </label>
        <input
          id="bonuses"
          v-model.number="form.bonuses"
          type="number"
          step="0.01"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="deductions" class="block text-sm font-medium text-gray-700 mb-2">
          Deductions (€)
        </label>
        <input
          id="deductions"
          v-model.number="form.deductions"
          type="number"
          step="0.01"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="tax_amount" class="block text-sm font-medium text-gray-700 mb-2">
          Tax Amount (€)
        </label>
        <input
          id="tax_amount"
          v-model.number="form.tax_amount"
          type="number"
          step="0.01"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="net_salary" class="block text-sm font-medium text-gray-700 mb-2">
          Net Salary (€) <span class="text-red-500">*</span>
        </label>
        <input
          id="net_salary"
          v-model.number="form.net_salary"
          type="number"
          step="0.01"
          required
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div>
      <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
        Status <span class="text-red-500">*</span>
      </label>
      <select
        id="status"
        v-model="form.status"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="draft">Draft</option>
        <option value="approved">Approved</option>
        <option value="paid">Paid</option>
      </select>
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
        placeholder="Additional notes..."
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
        {{ loading ? 'Saving...' : 'Save Payroll' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { StaffPayroll } from '~/stores/payroll'

interface Props {
  staffId?: string
  initialData?: StaffPayroll
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
  month: props.initialData?.month || new Date().getMonth() + 1,
  year: props.initialData?.year || new Date().getFullYear(),
  base_salary: props.initialData?.base_salary || 0,
  overtime_hours: props.initialData?.overtime_hours || 0,
  overtime_rate: props.initialData?.overtime_rate || 0,
  overtime_amount: props.initialData?.overtime_amount || 0,
  bonuses: props.initialData?.bonuses || 0,
  deductions: props.initialData?.deductions || 0,
  tax_amount: props.initialData?.tax_amount || 0,
  net_salary: props.initialData?.net_salary || 0,
  status: props.initialData?.status || 'draft',
  notes: props.initialData?.notes || ''
})

// Auto-calculate overtime amount
watch([() => form.value.overtime_hours, () => form.value.overtime_rate], () => {
  if (form.value.overtime_hours && form.value.overtime_rate) {
    form.value.overtime_amount = form.value.overtime_hours * form.value.overtime_rate
  }
})

// Auto-calculate net salary
watch([
  () => form.value.base_salary,
  () => form.value.overtime_amount,
  () => form.value.bonuses,
  () => form.value.deductions,
  () => form.value.tax_amount
], () => {
  form.value.net_salary = 
    form.value.base_salary +
    form.value.overtime_amount +
    form.value.bonuses -
    form.value.deductions -
    form.value.tax_amount
})

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const handleSubmit = () => {
  loading.value = true
  error.value = ''

  emit('submit', {
    ...form.value
  })
}
</script>
