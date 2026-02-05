<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Monthly Billing</Heading>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/attendance/calendar"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          📅 Attendance Calendar
        </NuxtLink>
        <NuxtLink
          to="/admin/lunch/billing/timetable"
          class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          📅 Timetables
        </NuxtLink>
        <NuxtLink
          to="/admin/lunch/billing/generate"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ Generate Billing
        </NuxtLink>
        <NuxtLink
          to="/admin/lunch/billing/reconciliation"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          🔍 Reconciliation
        </NuxtLink>
        <NuxtLink
          to="/admin/lunch/billing/config"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ⚙️ Config
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <select
            v-model.number="filters.month"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">All</option>
            <option v-for="m in 12" :key="m" :value="m">
              {{ getMonthName(m) }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            v-model.number="filters.year"
            type="number"
            :min="new Date().getFullYear() - 1"
            :max="new Date().getFullYear() + 1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Year"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="applyFilters"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="filteredBills.length === 0" class="p-8 text-center text-gray-500">
        No bills found.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month/Year</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refund</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="bill in filteredBills" :key="bill.id" class="hover:bg-gray-50">
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getChildName(bill.child_id) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ getMonthName(bill.month) }} {{ bill.year }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm" :class="bill.total_amount === 0 ? 'text-red-600 font-medium' : 'text-gray-900'">
                €{{ bill.total_amount.toFixed(2) }}
                <span v-if="bill.total_amount === 0" class="ml-1 text-xs text-red-500">⚠️</span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                €{{ bill.paid_amount.toFixed(2) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                €{{ bill.refund_amount.toFixed(2) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                    bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ bill.status }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(bill.due_date) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-1">
                  <NuxtLink
                    :to="`/admin/lunch/billing/${bill.id}`"
                    class="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    title="View Details"
                  >
                    <span class="text-lg">👁️</span>
                  </NuxtLink>
                  <button
                    @click="deleteBill(bill.id)"
                    :disabled="deleting === bill.id"
                    class="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Bill"
                  >
                    <span class="text-lg">{{ deleting === bill.id ? '⏳' : '🗑️' }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useBillingStore } from '~/stores/billing'
import { useChildrenStore } from '~/stores/children'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const billingStore = useBillingStore()
const childrenStore = useChildrenStore()
const { getUserKitaId } = useKita()

const { bills, loading, error } = storeToRefs(billingStore)
const { children } = storeToRefs(childrenStore)

const deleting = ref<string | null>(null)

const filters = ref({
  month: null as number | null,
  year: new Date().getFullYear(),
  status: ''
})

const filteredBills = computed(() => {
  let result = bills.value

  if (filters.value.month) {
    result = result.filter(b => b.month === filters.value.month)
  }
  if (filters.value.year) {
    result = result.filter(b => b.year === filters.value.year)
  }
  if (filters.value.status) {
    result = result.filter(b => b.status === filters.value.status)
  }

  return result
})

onMounted(async () => {
  const kitaId = await getUserKitaId()
  await Promise.all([
    billingStore.fetchBills(undefined, undefined, undefined, kitaId || undefined),
    childrenStore.fetchChildren(kitaId || undefined)
  ])
})

const applyFilters = async () => {
  const kitaId = await getUserKitaId()
  await billingStore.fetchBills(undefined, filters.value.month || undefined, filters.value.year || undefined, kitaId || undefined)
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

const deleteBill = async (billId: string) => {
  const bill = bills.value.find(b => b.id === billId)
  const childName = bill ? getChildName(bill.child_id) : 'this bill'
  const period = bill ? `${getMonthName(bill.month)} ${bill.year}` : ''
  
  if (!confirm(`Are you sure you want to delete the bill for ${childName} (${period})? This action cannot be undone and will also delete all billing items.`)) {
    return
  }

  deleting.value = billId

  try {
    const response = await $fetch(`/api/admin/lunch/billing/${billId}/delete`, {
      method: 'DELETE'
    })

    if (response.success) {
      alert('Bill deleted successfully!')
      await billingStore.fetchBills()
    } else {
      throw new Error(response.message || 'Failed to delete bill')
    }
  } catch (e: any) {
    console.error('Error deleting bill:', e)
    alert(e.data?.message || e.message || 'Failed to delete bill')
  } finally {
    deleting.value = null
  }
}
</script>
