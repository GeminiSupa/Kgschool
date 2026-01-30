<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/billing"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Billing
      </NuxtLink>
      <Heading size="xl">Billing Reports</Heading>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
          <select
            v-model.number="filters.startMonth"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="m in 12" :key="m" :value="m">
              {{ getMonthName(m) }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
          <input
            v-model.number="filters.startYear"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">End Month</label>
          <select
            v-model.number="filters.endMonth"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="m in 12" :key="m" :value="m">
              {{ getMonthName(m) }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">End Year</label>
          <input
            v-model.number="filters.endYear"
            type="number"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div class="mt-4 flex gap-2">
        <button
          @click="generateReport"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Generating...' : 'Generate Report' }}
        </button>
        <button
          v-if="reportData"
          @click="exportToCSV"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          📥 Export to CSV
        </button>
      </div>
    </div>

    <!-- Report Summary -->
    <div v-if="reportData" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Summary</Heading>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="p-4 bg-blue-50 rounded-md">
            <p class="text-sm text-gray-600">Total Revenue</p>
            <p class="text-2xl font-bold text-blue-600">€{{ reportData.totalRevenue.toFixed(2) }}</p>
          </div>
          <div class="p-4 bg-green-50 rounded-md">
            <p class="text-sm text-gray-600">Total Paid</p>
            <p class="text-2xl font-bold text-green-600">€{{ reportData.totalPaid.toFixed(2) }}</p>
          </div>
          <div class="p-4 bg-yellow-50 rounded-md">
            <p class="text-sm text-gray-600">Total Refunds</p>
            <p class="text-2xl font-bold text-yellow-600">€{{ reportData.totalRefunds.toFixed(2) }}</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-md">
            <p class="text-sm text-gray-600">Pending Amount</p>
            <p class="text-2xl font-bold text-gray-600">€{{ reportData.pendingAmount.toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <!-- Monthly Breakdown -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Monthly Breakdown</Heading>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month/Year</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refunds</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bills Count</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="month in reportData.monthlyBreakdown" :key="`${month.month}-${month.year}`" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ getMonthName(month.month) }} {{ month.year }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  €{{ month.totalRevenue.toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                  €{{ month.totalPaid.toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-yellow-600">
                  €{{ month.totalRefunds.toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  €{{ month.pendingAmount.toFixed(2) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ month.billsCount }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
      Select date range and click "Generate Report" to view billing reports.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const loading = ref(false)
const reportData = ref<any>(null)

const filters = ref({
  startMonth: new Date().getMonth() + 1,
  startYear: new Date().getFullYear(),
  endMonth: new Date().getMonth() + 1,
  endYear: new Date().getFullYear()
})

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const generateReport = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/lunch/billing/reports', {
      method: 'GET',
      params: {
        start_month: filters.value.startMonth,
        start_year: filters.value.startYear,
        end_month: filters.value.endMonth,
        end_year: filters.value.endYear
      }
    })

    reportData.value = response
  } catch (e: any) {
    alert(e.data?.message || e.message || 'Failed to generate report')
  } finally {
    loading.value = false
  }
}

const exportToCSV = () => {
  if (!reportData.value) return

  // Create CSV content
  let csv = 'Month/Year,Total Revenue,Paid,Refunds,Pending,Bills Count\n'
  
  reportData.value.monthlyBreakdown.forEach((month: any) => {
    csv += `${getMonthName(month.month)} ${month.year},${month.totalRevenue},${month.totalPaid},${month.totalRefunds},${month.pendingAmount},${month.billsCount}\n`
  })

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `billing-report-${filters.value.startMonth}-${filters.value.startYear}-to-${filters.value.endMonth}-${filters.value.endYear}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}
</script>
