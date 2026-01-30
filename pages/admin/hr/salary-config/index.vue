<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Salary Configuration</Heading>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/hr/salary-config/new"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ New Config
        </NuxtLink>
        <NuxtLink
          to="/admin/hr/payroll"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ← Back to Payroll
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="configs.length === 0" class="p-8 text-center text-gray-500">
        No salary configurations found.
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime Multiplier</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Period</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="config in configs" :key="config.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ getStaffName(config.staff_id) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              €{{ config.base_salary.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ config.hourly_rate ? `€${config.hourly_rate.toFixed(2)}` : '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ config.overtime_multiplier }}x
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(config.effective_from) }}
              <span v-if="config.effective_to"> - {{ formatDate(config.effective_to) }}</span>
              <span v-else class="text-green-600"> (Active)</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <NuxtLink
                :to="`/admin/hr/salary-config/${config.id}`"
                class="text-blue-600 hover:text-blue-900"
              >
                Edit
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useSalaryConfigStore } from '~/stores/salaryConfig'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const salaryConfigStore = useSalaryConfigStore()

const { configs, loading, error } = storeToRefs(salaryConfigStore)
const staff = ref<any[]>([])

onMounted(async () => {
  try {
    await Promise.all([
      salaryConfigStore.fetchConfigs(),
      fetchStaff()
    ])
  } catch (e: any) {
    console.error('Error loading salary configs:', e)
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

const getStaffName = (staffId: string) => {
  const s = staff.value.find(s => s.id === staffId)
  return s?.full_name || staffId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
