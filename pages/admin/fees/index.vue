<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Monthly Fees</Heading>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/fees/generate"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ Generate Fees
        </NuxtLink>
        <NuxtLink
          to="/admin/fees/config"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ⚙️ Fee Config
        </NuxtLink>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <form @submit.prevent="filterFees" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <select
            v-model.number="filters.month"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option :value="0">All Months</option>
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
            :min="2020"
            :max="2100"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="waived">Waived</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            type="submit"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="filteredFees.length === 0" class="p-8 text-center text-gray-500">
        No fees found.
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="fee in filteredFees" :key="fee.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ getChildName(fee.child_id) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ getMonthName(fee.month) }} {{ fee.year }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatFeeType(fee.fee_type) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              €{{ fee.amount.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(fee.due_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                  fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  fee.status === 'waived' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                ]"
              >
                {{ fee.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <NuxtLink
                :to="`/admin/fees/${fee.id}`"
                class="text-blue-600 hover:text-blue-900"
              >
                View
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMonthlyFeesStore } from '~/stores/monthlyFees'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const monthlyFeesStore = useMonthlyFeesStore()
const childrenStore = useChildrenStore()

const { fees, loading, error } = storeToRefs(monthlyFeesStore)
const { children } = storeToRefs(childrenStore)

const filters = ref({
  month: 0,
  year: new Date().getFullYear(),
  status: ''
})

const filteredFees = computed(() => {
  let result = fees.value

  if (filters.value.month > 0) {
    result = result.filter(f => f.month === filters.value.month)
  }

  if (filters.value.year) {
    result = result.filter(f => f.year === filters.value.year)
  }

  if (filters.value.status) {
    result = result.filter(f => f.status === filters.value.status)
  }

  return result
})

onMounted(async () => {
  try {
    await Promise.all([
      monthlyFeesStore.fetchFees(),
      childrenStore.fetchChildren()
    ])
  } catch (e: any) {
    console.error('Error loading fees:', e)
  }
})

const filterFees = async () => {
  await monthlyFeesStore.fetchFees(
    undefined,
    filters.value.month || undefined,
    filters.value.year || undefined
  )
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
</script>
