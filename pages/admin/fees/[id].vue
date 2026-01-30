<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/fees"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Fees
      </NuxtLink>
      <Heading size="xl">Fee Details</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="fee" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Child</label>
            <p class="mt-1 text-gray-900">{{ getChildName(fee.child_id) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Period</label>
            <p class="mt-1 text-gray-900">{{ getMonthName(fee.month) }} {{ fee.year }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Fee Type</label>
            <p class="mt-1 text-gray-900">{{ formatFeeType(fee.fee_type) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Amount</label>
            <p class="mt-1 text-lg font-bold text-gray-900">€{{ fee.amount.toFixed(2) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Due Date</label>
            <p class="mt-1 text-gray-900">{{ formatDate(fee.due_date) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Status</label>
            <span
              :class="[
                'inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full',
                fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                fee.status === 'waived' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              ]"
            >
              {{ fee.status }}
            </span>
          </div>
        </div>

        <div v-if="fee.notes" class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Notes</label>
          <p class="mt-1 text-gray-900">{{ fee.notes }}</p>
        </div>

        <div v-if="fee.paid_at" class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Paid At</label>
          <p class="mt-1 text-gray-900">{{ formatDateTime(fee.paid_at) }}</p>
        </div>

        <div v-if="fee.payment_method" class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Payment Method</label>
          <p class="mt-1 text-gray-900">{{ fee.payment_method }}</p>
        </div>

        <div class="pt-4 border-t">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Payment History</h3>
          <div v-if="payments.length === 0" class="text-sm text-gray-500">
            No payments recorded yet.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="payment in payments"
              :key="payment.id"
              class="p-3 bg-gray-50 rounded-md"
            >
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm font-medium text-gray-900">€{{ payment.amount.toFixed(2) }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(payment.payment_date) }}</p>
                  <p v-if="payment.payment_method" class="text-xs text-gray-500">
                    Method: {{ payment.payment_method }}
                  </p>
                </div>
                <p v-if="payment.transaction_id" class="text-xs text-gray-500">
                  Ref: {{ payment.transaction_id }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="fee.status !== 'paid' && fee.status !== 'waived'" class="pt-4 border-t">
          <button
            @click="editFee"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
          >
            Edit
          </button>
          <button
            @click="waiveFee"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Waive Fee
          </button>
        </div>
      </div>

      <div v-if="showEditForm" class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Edit Fee</Heading>
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
                Amount (€) <span class="text-red-500">*</span>
              </label>
              <input
                id="amount"
                v-model.number="editForm.amount"
                type="number"
                step="0.01"
                required
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="due_date" class="block text-sm font-medium text-gray-700 mb-2">
                Due Date <span class="text-red-500">*</span>
              </label>
              <input
                id="due_date"
                v-model="editForm.due_date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              v-model="editForm.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="waived">Waived</option>
            </select>
          </div>
          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              v-model="editForm.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              @click="showEditForm = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="updating"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {{ updating ? 'Updating...' : 'Update Fee' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMonthlyFeesStore } from '~/stores/monthlyFees'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const monthlyFeesStore = useMonthlyFeesStore()
const childrenStore = useChildrenStore()

const feeId = route.params.id as string
const loading = ref(true)
const error = ref('')
const fee = ref<any>(null)
const payments = ref<any[]>([])
const showEditForm = ref(false)
const updating = ref(false)

const editForm = ref({
  amount: 0,
  due_date: '',
  status: 'pending',
  notes: ''
})

onMounted(async () => {
  try {
    await Promise.all([
      fetchFee(),
      childrenStore.fetchChildren()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load fee'
  } finally {
    loading.value = false
  }
})

const fetchFee = async () => {
  try {
    await monthlyFeesStore.fetchFees()
    const found = monthlyFeesStore.fees.find(f => f.id === feeId)
    if (!found) {
      error.value = 'Fee not found'
      return
    }
    fee.value = found
    editForm.value = {
      amount: found.amount,
      due_date: found.due_date,
      status: found.status,
      notes: found.notes || ''
    }

    await monthlyFeesStore.fetchPayments(feeId)
    payments.value = monthlyFeesStore.payments
  } catch (e: any) {
    error.value = e.message || 'Failed to load fee'
  }
}

const getChildName = (childId: string) => {
  const child = childrenStore.children.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const formatFeeType = (type: string) => {
  const types: Record<string, string> = {
    tuition: 'Tuition',
    lunch: 'Lunch',
    activities: 'Activities',
    other: 'Other'
  }
  return types[type] || type
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

const editFee = () => {
  showEditForm.value = true
}

const handleUpdate = async () => {
  updating.value = true
  try {
    await monthlyFeesStore.updateFee(feeId, editForm.value)
    alert('Fee updated successfully!')
    showEditForm.value = false
    await fetchFee()
  } catch (e: any) {
    alert(e.message || 'Failed to update fee')
  } finally {
    updating.value = false
  }
}

const waiveFee = async () => {
  if (!confirm('Are you sure you want to waive this fee?')) return

  try {
    await monthlyFeesStore.updateFee(feeId, { status: 'waived' })
    alert('Fee waived successfully!')
    await fetchFee()
  } catch (e: any) {
    alert(e.message || 'Failed to waive fee')
  }
}
</script>
