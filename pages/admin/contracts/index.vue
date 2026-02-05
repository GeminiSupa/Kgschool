<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <Heading size="xl">Child Contracts</Heading>
      <NuxtLink
        to="/admin/contracts/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        + New Contract
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-4">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 flex gap-4">
        <select
          v-model="statusFilter"
          @change="applyFilters"
          class="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <!-- Contracts List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract #</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Category</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lunch Billing</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="contract in filteredContracts" :key="contract.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ contract.contract_number || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ getChildName(contract.child_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatHoursType(contract.betreuung_hours_type) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatFeeCategory(contract.fee_category) }}
                <span v-if="contract.subsidy_type" class="text-xs text-gray-500 block">
                  ({{ formatSubsidy(contract.subsidy_type) }})
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatBillingType(contract.lunch_billing_type) }}
                <span v-if="contract.lunch_flat_rate_amount" class="text-xs text-gray-500 block">
                  €{{ contract.lunch_flat_rate_amount.toFixed(2) }}/month
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(contract.status)">
                  {{ formatStatus(contract.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <NuxtLink
                  :to="`/admin/contracts/${contract.id}`"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  View
                </NuxtLink>
                <NuxtLink
                  :to="`/admin/contracts/${contract.id}/edit`"
                  class="text-indigo-600 hover:text-indigo-900"
                >
                  Edit
                </NuxtLink>
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
import { useContractsStore } from '~/stores/contracts'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const contractsStore = useContractsStore()
const loading = ref(true)
const error = ref('')
const statusFilter = ref('')
const children = ref<Record<string, string>>({})

const filteredContracts = computed(() => {
  let contracts = contractsStore.contracts
  if (statusFilter.value) {
    contracts = contracts.filter(c => c.status === statusFilter.value)
  }
  return contracts
})

onMounted(async () => {
  try {
    await Promise.all([
      contractsStore.fetchContracts(),
      loadChildren()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load contracts'
  } finally {
    loading.value = false
  }
})

const loadChildren = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('children')
      .select('id, first_name, last_name')

    if (data) {
      data.forEach(child => {
        children.value[child.id] = `${child.first_name} ${child.last_name}`
      })
    }
  } catch (e: any) {
    console.error('Error loading children:', e)
  }
}

const applyFilters = () => {
  // Applied via computed
}

const getChildName = (childId: string) => {
  return children.value[childId] || childId
}

const formatHoursType = (type: string) => {
  const types: Record<string, string> = {
    '25': '25h/Woche',
    '35': '35h/Woche',
    '45': '45h/Woche',
    'ganztag': 'Ganztag',
    'halbtag': 'Halbtag'
  }
  return types[type] || type
}

const formatFeeCategory = (category: string) => {
  const categories: Record<string, string> = {
    standard: 'Standard',
    reduced: 'Reduced',
    waived: 'Waived',
    subsidized: 'Subsidized'
  }
  return categories[category] || category
}

const formatSubsidy = (subsidy: string) => {
  const subsidies: Record<string, string> = {
    BuT: 'BuT',
    BremenPass: 'Bremen Pass',
    Geschwisterrabatt: 'Geschwisterrabatt',
    Landeszuschuss: 'Landeszuschuss',
    other: 'Other'
  }
  return subsidies[subsidy] || subsidy
}

const formatBillingType = (type: string) => {
  const types: Record<string, string> = {
    flat_monthly: 'Flat Monthly',
    per_meal: 'Per Meal',
    hybrid: 'Hybrid'
  }
  return types[type] || type
}

const formatStatus = (status: string) => {
  const statuses: Record<string, string> = {
    active: 'Active',
    suspended: 'Suspended',
    terminated: 'Terminated',
    pending: 'Pending'
  }
  return statuses[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    active: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    suspended: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    terminated: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
    pending: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
  }
  return classes[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}
</script>
