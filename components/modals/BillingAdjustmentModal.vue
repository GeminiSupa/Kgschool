<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <Heading size="lg">Adjust Bill Amount</Heading>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div class="mb-4">
          <p class="text-sm text-gray-600">Child: <span class="font-medium">{{ childName }}</span></p>
          <p class="text-sm text-gray-600">Period: <span class="font-medium">{{ period }}</span></p>
          <p class="text-xs text-gray-500 mt-2">Current amount: €{{ currentAmount.toFixed(2) }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Total Amount (€) *
            </label>
            <input
              v-model.number="form.total_amount"
              type="number"
              step="0.01"
              min="0"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Paid Amount (€)
            </label>
            <input
              v-model.number="form.paid_amount"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount (€)
            </label>
            <input
              v-model.number="form.refund_amount"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this adjustment..."
            />
          </div>

          <div class="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                v-model="form.notify_parent"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-blue-900">
                Notify parent about this update
              </span>
            </label>
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {{ error }}
          </div>

          <div class="flex gap-3 justify-end pt-4">
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'

interface Props {
  isOpen: boolean
  billingId: string
  childName: string
  period: string
  currentAmount: number
  currentPaidAmount?: number
  currentRefundAmount?: number
  currentNotes?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const form = ref({
  total_amount: 0,
  paid_amount: 0,
  refund_amount: 0,
  notes: '',
  notify_parent: false
})

const saving = ref(false)
const error = ref('')
const authStore = useAuthStore()

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = {
      total_amount: props.currentAmount,
      paid_amount: props.currentPaidAmount || 0,
      refund_amount: props.currentRefundAmount || 0,
      notes: props.currentNotes || '',
      notify_parent: false
    }
    error.value = ''
  }
})

const handleClose = () => {
  if (!saving.value) {
    emit('close')
  }
}

const handleSubmit = async () => {
  console.log('BillingAdjustmentModal: handleSubmit called', {
    billingId: props.billingId,
    form: form.value
  })

  error.value = ''

  if (!props.billingId) {
    error.value = 'Missing billing ID'
    console.error('BillingAdjustmentModal: Missing billing ID')
    return
  }

  // Validate amounts
  if (form.value.total_amount === null || form.value.total_amount === undefined) {
    error.value = 'Total amount is required'
    return
  }

  if (form.value.total_amount < 0) {
    error.value = 'Total amount cannot be negative'
    return
  }

  if (form.value.paid_amount < 0) {
    error.value = 'Paid amount cannot be negative'
    return
  }

  if (form.value.refund_amount < 0) {
    error.value = 'Refund amount cannot be negative'
    return
  }

  if (form.value.paid_amount > form.value.total_amount) {
    error.value = 'Paid amount cannot exceed total amount'
    return
  }

  if (form.value.refund_amount > form.value.total_amount) {
    error.value = 'Refund amount cannot exceed total amount'
    return
  }

  // Round to 2 decimal places
  form.value.total_amount = Math.round(form.value.total_amount * 100) / 100
  form.value.paid_amount = Math.round((form.value.paid_amount || 0) * 100) / 100
  form.value.refund_amount = Math.round((form.value.refund_amount || 0) * 100) / 100

  saving.value = true

  try {
    console.log('BillingAdjustmentModal: Calling API...', `/api/admin/lunch/billing/${props.billingId}/adjust`)
    
    const response = await $fetch(`/api/admin/lunch/billing/${props.billingId}/adjust`, {
      method: 'POST',
      body: {
        total_amount: Number(form.value.total_amount),
        paid_amount: Number(form.value.paid_amount || 0),
        refund_amount: Number(form.value.refund_amount || 0),
        notes: form.value.notes || null,
        notify_parent: form.value.notify_parent,
        adjusted_by_user_id: authStore.user?.id || null
      }
    })

    console.log('BillingAdjustmentModal: API response', response)

    if (response && response.success) {
      emit('saved')
      handleClose()
    } else {
      throw new Error(response?.message || 'Update failed')
    }
  } catch (e: any) {
    console.error('BillingAdjustmentModal: Error adjusting bill', e)
    error.value = e.data?.message || e.message || 'Failed to adjust bill. Please check the console for details.'
  } finally {
    saving.value = false
  }
}
</script>
