<template>
  <div>
    <Heading size="xl" class="mb-6">My Payroll</Heading>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="myPayroll.length === 0" class="p-8 text-center text-gray-500">
        No payroll records found.
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonuses</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="record in myPayroll" :key="record.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePayrollStore } from '~/stores/payroll'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'support'
})

const payrollStore = usePayrollStore()
const authStore = useAuthStore()

const { payroll, loading, error } = storeToRefs(payrollStore)

const myPayroll = computed(() => {
  if (!authStore.user?.id) return []
  return payroll.value.filter(p => p.staff_id === authStore.user?.id)
})

onMounted(async () => {
  if (authStore.user?.id) {
    await payrollStore.fetchPayroll(authStore.user.id)
  }
})

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}
</script>
