<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/parent/fees"
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
      </div>

      <div v-if="fee.status === 'pending' || fee.status === 'overdue'" class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Make Payment</Heading>
        <FeePaymentForm
          :fee-id="fee.id"
          :fee-amount="fee.amount"
          :total-paid="totalPaid"
          @submit="handlePayment"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMonthlyFeesStore } from '~/stores/monthlyFees'
import { useChildrenStore } from '~/stores/children'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import FeePaymentForm from '~/components/forms/FeePaymentForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const route = useRoute()
const router = useRouter()
const monthlyFeesStore = useMonthlyFeesStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()

const feeId = route.params.id as string
const loading = ref(true)
const error = ref('')
const fee = ref<any>(null)
const payments = ref<any[]>([])

const { fees } = storeToRefs(monthlyFeesStore)
const { children } = storeToRefs(childrenStore)

const totalPaid = ref(0)

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
    const found = fees.value.find(f => f.id === feeId)
    if (!found) {
      error.value = 'Fee not found'
      return
    }

    // Verify this fee belongs to one of the parent's children
    const myChildren = children.value.filter(c => c.parent_ids?.includes(authStore.user!.id))
    if (!myChildren.find(c => c.id === found.child_id)) {
      error.value = 'Access denied'
      return
    }

    fee.value = found

    await monthlyFeesStore.fetchPayments(feeId)
    payments.value = monthlyFeesStore.payments
    
    // Calculate total paid
    totalPaid.value = await monthlyFeesStore.getTotalPaid(feeId)
  } catch (e: any) {
    error.value = e.message || 'Failed to load fee'
  }
}

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
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

const handlePayment = async (paymentData: any) => {
  try {
    const response = await $fetch(`/api/parent/fees/${feeId}/pay`, {
      method: 'POST',
      body: paymentData
    })

    if (response.success) {
      alert('Payment recorded successfully!')
      await fetchFee()
      router.push('/parent/fees')
    } else {
      throw new Error(response.message || 'Failed to record payment')
    }
  } catch (e: any) {
    alert(e.data?.message || e.message || 'Failed to record payment')
  }
}

const handleCancel = () => {
  router.push('/parent/fees')
}
</script>
