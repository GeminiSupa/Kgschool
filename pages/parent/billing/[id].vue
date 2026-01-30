<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/parent/billing"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Billing
      </NuxtLink>
      <Heading size="xl">Billing Details</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="bill" class="space-y-6">
      <!-- Bill Summary -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-600">Child</label>
            <p class="mt-1 text-lg text-gray-900">{{ getChildName(bill.child_id) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Period</label>
            <p class="mt-1 text-lg text-gray-900">{{ getMonthName(bill.month) }} {{ bill.year }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Total Amount</label>
            <p class="mt-1 text-lg text-gray-900">€{{ bill.total_amount.toFixed(2) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Status</label>
            <span
              :class="[
                'inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full',
                bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              ]"
            >
              {{ bill.status }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <label class="block text-sm font-medium text-gray-600">Paid Amount</label>
            <p class="mt-1 text-gray-900">€{{ bill.paid_amount.toFixed(2) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Refund Amount</label>
            <p class="mt-1 text-green-600">€{{ bill.refund_amount.toFixed(2) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Due Date</label>
            <p class="mt-1 text-gray-900">{{ formatDate(bill.due_date) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Billing Date</label>
            <p class="mt-1 text-gray-900">{{ formatDate(bill.billing_date) }}</p>
          </div>
        </div>

        <div v-if="bill.document_url" class="mt-6 pt-6 border-t">
          <button
            @click="downloadDocument"
            :disabled="downloading"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ downloading ? 'Loading...' : '📄 Download Billing Document' }}
          </button>
        </div>
      </div>

      <!-- Billing Items -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Billing Items</Heading>
        <div v-if="itemsLoading" class="flex justify-center py-8">
          <LoadingSpinner />
        </div>
        <div v-else-if="items.length === 0" class="text-gray-500 text-sm">
          No billing items found.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refundable</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refunded</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(item.date) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  €{{ item.meal_price.toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ item.is_informed_absence ? 'Informed Absence' : (item.order_id ? 'Order' : 'Uninformed Absence') }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      item.is_refundable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ item.is_refundable ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      item.refunded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ item.refunded ? 'Yes' : 'No' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useBillingStore } from '~/stores/billing'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const route = useRoute()
const billingStore = useBillingStore()
const childrenStore = useChildrenStore()

const { children } = storeToRefs(childrenStore)

const loading = ref(true)
const error = ref('')
const bill = ref<any>(null)
const items = ref<any[]>([])
const itemsLoading = ref(false)
const downloading = ref(false)

onMounted(async () => {
  try {
    await childrenStore.fetchChildren()
    const billData = await billingStore.fetchBillById(route.params.id as string)
    if (!billData) {
      error.value = 'Bill not found'
      return
    }
    bill.value = billData

    itemsLoading.value = true
    items.value = await billingStore.fetchBillingItems(route.params.id as string)
  } catch (e: any) {
    error.value = e.message || 'Failed to load bill'
  } finally {
    loading.value = false
    itemsLoading.value = false
  }
})

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const downloadDocument = async () => {
  if (!bill.value.document_url) return

  downloading.value = true
  try {
    const response = await $fetch('/api/admin/lunch/billing/get-document', {
      method: 'GET',
      params: { billing_id: bill.value.id }
    })

    if (response.success && response.signed_url) {
      // Open document in new tab
      window.open(response.signed_url, '_blank')
    }
  } catch (e: any) {
    alert(e.data?.message || e.message || 'Failed to get document')
  } finally {
    downloading.value = false
  }
}
</script>
