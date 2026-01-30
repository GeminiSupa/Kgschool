<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/billing"
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

        <!-- Actions -->
        <div class="mt-6 pt-6 border-t flex gap-3 flex-wrap">
          <button
            v-if="bill.status !== 'paid'"
            @click="markAsPaid"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            ✓ Mark as Paid
          </button>
          <button
            @click="handleAdjustClick"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            💰 Adjust Amount
          </button>
          <label class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
            📄 Upload Document
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              @change="handleFileUpload"
              class="hidden"
            />
          </label>
        </div>
        
        <!-- Warning if amount is 0 -->
        <div v-if="bill.total_amount === 0" class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p class="text-sm text-yellow-800">
            ⚠️ <strong>Warning:</strong> Total amount is €0.00. This usually means:
          </p>
          <ul class="text-sm text-yellow-700 mt-2 ml-4 list-disc">
            <li>No lunch pricing is set up for this child's group</li>
            <li>No lunch orders were found for this period</li>
            <li>Child was absent for all days</li>
          </ul>
          <div class="mt-3 flex gap-2">
            <NuxtLink
              to="/admin/lunch/pricing"
              class="text-sm text-yellow-800 underline hover:text-yellow-900"
            >
              Set up lunch pricing →
            </NuxtLink>
            <button
              @click="showAdjustmentModal = true"
              class="text-sm text-yellow-800 underline hover:text-yellow-900"
            >
              Manually adjust amount →
            </button>
          </div>
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
                  <span :class="item.meal_price === 0 ? 'text-red-600 font-medium' : ''">
                    €{{ item.meal_price.toFixed(2) }}
                  </span>
                  <span v-if="item.meal_price === 0" class="ml-2 text-xs text-red-500">(No price set)</span>
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

      <!-- Audit Log -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Adjustment History</Heading>
        <div v-if="auditLogLoading" class="flex justify-center py-8">
          <LoadingSpinner />
        </div>
        <div v-else-if="auditLog.length === 0" class="text-gray-500 text-sm">
          No adjustments have been made to this bill.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="log in auditLog"
            :key="log.id"
            class="p-4 bg-gray-50 rounded-md border border-gray-200"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">
                  {{ formatAdjustmentType(log.adjustment_type) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Adjusted by {{ getAdminName(log.adjusted_by) }} on {{ formatDateTime(log.created_at) }}
                </p>
              </div>
            </div>
            <div v-if="log.previous_total_amount !== log.new_total_amount" class="mt-2 text-sm">
              <p class="text-gray-600">
                <span class="font-medium">Total Amount:</span>
                <span class="line-through text-red-600 ml-2">€{{ log.previous_total_amount.toFixed(2) }}</span>
                <span class="text-green-600 ml-2">→ €{{ log.new_total_amount.toFixed(2) }}</span>
              </p>
            </div>
            <div v-if="log.previous_paid_amount !== log.new_paid_amount" class="mt-1 text-sm">
              <p class="text-gray-600">
                <span class="font-medium">Paid Amount:</span>
                <span class="line-through text-red-600 ml-2">€{{ log.previous_paid_amount.toFixed(2) }}</span>
                <span class="text-green-600 ml-2">→ €{{ log.new_paid_amount.toFixed(2) }}</span>
              </p>
            </div>
            <div v-if="log.previous_refund_amount !== log.new_refund_amount" class="mt-1 text-sm">
              <p class="text-gray-600">
                <span class="font-medium">Refund Amount:</span>
                <span class="line-through text-red-600 ml-2">€{{ log.previous_refund_amount.toFixed(2) }}</span>
                <span class="text-green-600 ml-2">→ €{{ log.new_refund_amount.toFixed(2) }}</span>
              </p>
            </div>
            <div v-if="log.reason" class="mt-2 text-sm text-gray-600">
              <span class="font-medium">Reason:</span> {{ log.reason }}
            </div>
            <div v-if="log.notes" class="mt-1 text-xs text-gray-500">
              {{ log.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Billing Adjustment Modal -->
    <BillingAdjustmentModal
      v-if="bill && bill.id"
      :is-open="showAdjustmentModal"
      :billing-id="bill.id"
      :child-name="getChildName(bill.child_id)"
      :period="`${getMonthName(bill.month)} ${bill.year}`"
      :current-amount="bill.total_amount"
      :current-paid-amount="bill.paid_amount"
      :current-refund-amount="bill.refund_amount"
      :current-notes="bill.notes"
      @close="handleModalClose"
      @saved="handleAdjustmentSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useBillingStore } from '~/stores/billing'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import BillingAdjustmentModal from '~/components/modals/BillingAdjustmentModal.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const supabase = useSupabaseClient()
const billingStore = useBillingStore()
const childrenStore = useChildrenStore()

const { children } = storeToRefs(childrenStore)

const loading = ref(true)
const error = ref('')
const bill = ref<any>(null)
const items = ref<any[]>([])
const itemsLoading = ref(false)
const downloading = ref(false)
const showAdjustmentModal = ref(false)
const auditLog = ref<any[]>([])
const auditLogLoading = ref(false)
const adminNames = ref<Record<string, string>>({})

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
    
    // Load audit log
    await fetchAuditLog()
  } catch (e: any) {
    error.value = e.message || 'Failed to load bill'
  } finally {
    loading.value = false
    itemsLoading.value = false
  }
})

const fetchAuditLog = async () => {
  auditLogLoading.value = true
  try {
    const { data, error: err } = await supabase
      .from('billing_audit_log')
      .select('*')
      .eq('billing_id', route.params.id as string)
      .order('created_at', { ascending: false })

    if (err) throw err
    auditLog.value = data || []

    // Fetch admin names
    const adminIds = [...new Set(auditLog.value.map(log => log.adjusted_by))]
    if (adminIds.length > 0) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', adminIds)

      if (admins) {
        admins.forEach(admin => {
          adminNames.value[admin.id] = admin.full_name
        })
      }
    }
  } catch (e: any) {
    console.error('Error fetching audit log:', e)
  } finally {
    auditLogLoading.value = false
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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

const formatAdjustmentType = (type: string) => {
  const types: Record<string, string> = {
    amount: 'Amount Adjustment',
    status: 'Status Change',
    payment: 'Payment Update',
    refund: 'Refund Adjustment'
  }
  return types[type] || type
}

const getAdminName = (adminId: string) => {
  return adminNames.value[adminId] || 'System'
}

const markAsPaid = async () => {
  if (!confirm('Mark this bill as paid?')) return

  try {
    await billingStore.updateBillStatus(bill.value.id, 'paid', bill.value.total_amount)
    bill.value.status = 'paid'
    bill.value.paid_amount = bill.value.total_amount
    alert('Bill marked as paid!')
  } catch (e: any) {
    alert(e.message || 'Failed to update bill')
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be less than 10 MB')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await $fetch(`/api/admin/lunch/billing/upload?id=${bill.value.id}`, {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      bill.value.document_url = response.document_path
      alert('Document uploaded successfully!')
    }
  } catch (e: any) {
    alert(e.data?.message || e.message || 'Failed to upload document')
  }
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

const handleAdjustClick = () => {
  if (!bill.value || !bill.value.id) {
    alert('Bill data not loaded yet. Please wait...')
    return
  }
  showAdjustmentModal.value = true
}

const handleModalClose = () => {
  showAdjustmentModal.value = false
}

const handleAdjustmentSaved = async () => {
  console.log('Bill adjustment saved, reloading data...')
  // Reload bill data and audit log
  try {
    const billData = await billingStore.fetchBillById(route.params.id as string)
    if (billData) {
      bill.value = billData
    }
    await fetchAuditLog() // Refresh audit log
    alert('Bill adjusted successfully!')
  } catch (e: any) {
    console.error('Error reloading bill:', e)
    alert('Bill was updated but failed to reload. Please refresh the page.')
  }
}
</script>
