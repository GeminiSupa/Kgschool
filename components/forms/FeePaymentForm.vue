<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Fee Amount
      </label>
      <p class="text-lg font-medium text-gray-900">€{{ feeAmount.toFixed(2) }}</p>
      <p v-if="totalPaid > 0" class="text-sm text-gray-600 mt-1">
        Already paid: €{{ totalPaid.toFixed(2) }}
      </p>
      <p v-if="remainingAmount > 0" class="text-sm text-blue-600 mt-1">
        Remaining: €{{ remainingAmount.toFixed(2) }}
      </p>
    </div>

    <div>
      <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
        Payment Amount (€) <span class="text-red-500">*</span>
      </label>
      <input
        id="amount"
        v-model.number="form.amount"
        type="number"
        step="0.01"
        required
        :min="0"
        :max="remainingAmount"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">Maximum: €{{ remainingAmount.toFixed(2) }}</p>
    </div>

    <div>
      <label for="payment_date" class="block text-sm font-medium text-gray-700 mb-2">
        Payment Date <span class="text-red-500">*</span>
      </label>
      <input
        id="payment_date"
        v-model="form.payment_date"
        type="date"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="payment_method" class="block text-sm font-medium text-gray-700 mb-2">
        Payment Method
      </label>
      <select
        id="payment_method"
        v-model="form.payment_method"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select method</option>
        <option value="cash">Cash</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="credit_card">Credit Card</option>
        <option value="debit_card">Debit Card</option>
        <option value="check">Check</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div>
      <label for="transaction_id" class="block text-sm font-medium text-gray-700 mb-2">
        Transaction ID (Optional)
      </label>
      <input
        id="transaction_id"
        v-model="form.transaction_id"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., Bank reference number"
      />
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
        placeholder="Additional notes about this payment..."
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
        {{ loading ? 'Processing...' : 'Record Payment' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  feeId: string
  feeAmount: number
  totalPaid: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const loading = ref(false)
const error = ref('')

const form = ref({
  amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: '',
  transaction_id: '',
  notes: ''
})

const remainingAmount = computed(() => {
  return Math.max(0, props.feeAmount - props.totalPaid)
})

const isFormValid = computed(() => {
  return form.value.amount > 0 &&
    form.value.amount <= remainingAmount.value &&
    form.value.payment_date
})

const handleSubmit = () => {
  if (!isFormValid.value) {
    error.value = 'Please enter a valid payment amount'
    return
  }

  loading.value = true
  error.value = ''

  emit('submit', {
    fee_id: props.feeId,
    ...form.value
  })
}
</script>
