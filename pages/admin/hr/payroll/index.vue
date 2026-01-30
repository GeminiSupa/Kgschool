<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Payroll Management</Heading>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/hr/payroll/generate"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ Generate Payroll
        </NuxtLink>
        <NuxtLink
          to="/admin/hr/salary-config"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ⚙️ Salary Config
        </NuxtLink>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <form @submit.prevent="filterPayroll" class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
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
      <div v-if="filteredPayroll.length === 0" class="p-8 text-center text-gray-500">
        No payroll records found.
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonuses</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="record in filteredPayroll" :key="record.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ getStaffName(record.staff_id) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ getMonthName(record.month) }} {{ record.year }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              €{{ record.base_salary.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              €{{ record.overtime_amount.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
              €{{ record.bonuses.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
              €{{ record.deductions.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              €{{ record.net_salary.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded-full',
                  record.status === 'paid' ? 'bg-green-100 text-green-800' :
                  record.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                ]"
              >
                {{ record.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <NuxtLink
                :to="`/admin/hr/payroll/${record.id}`"
                class="text-blue-600 hover:text-blue-900 mr-3"
              >
                View
              </NuxtLink>
              <button
                v-if="record.status !== 'paid'"
                @click="markAsPaid(record.id)"
                class="text-green-600 hover:text-green-900"
              >
                Mark Paid
              </button>
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
import { useSupabaseClient } from '#imports'
import { usePayrollStore } from '~/stores/payroll'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const payrollStore = usePayrollStore()

const { payroll, loading, error } = storeToRefs(payrollStore)
const staff = ref<any[]>([])

const filters = ref({
  month: 0,
  year: new Date().getFullYear(),
  status: ''
})

const filteredPayroll = computed(() => {
  let result = payroll.value

  if (filters.value.month > 0) {
    result = result.filter(p => p.month === filters.value.month)
  }

  if (filters.value.year) {
    result = result.filter(p => p.year === filters.value.year)
  }

  if (filters.value.status) {
    result = result.filter(p => p.status === filters.value.status)
  }

  return result
})

onMounted(async () => {
  try {
    await Promise.all([
      payrollStore.fetchPayroll(),
      fetchStaff()
    ])
  } catch (e: any) {
    console.error('Error loading payroll:', e)
  }
})

const fetchStaff = async () => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['teacher', 'support', 'kitchen'])
      .order('full_name')

    staff.value = data || []
  } catch (e: any) {
    console.error('Error fetching staff:', e)
  }
}

const filterPayroll = async () => {
  await payrollStore.fetchPayroll(
    undefined,
    filters.value.month || undefined,
    filters.value.year || undefined
  )
}

const getStaffName = (staffId: string) => {
  const s = staff.value.find(s => s.id === staffId)
  return s?.full_name || staffId
}

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const markAsPaid = async (id: string) => {
  if (!confirm('Mark this payroll as paid?')) return

  try {
    await payrollStore.markAsPaid(id)
    await payrollStore.fetchPayroll()
  } catch (e: any) {
    alert(e.message || 'Failed to mark as paid')
  }
}
</script>
