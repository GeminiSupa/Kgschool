<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/billing"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Billing
      </NuxtLink>
      <Heading size="xl">Billing Reconciliation</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Month</label>
          <select
            v-model.number="filters.month"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="m in 12" :key="m" :value="m">
              {{ getMonthName(m) }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <input
            v-model.number="filters.year"
            type="number"
            :min="new Date().getFullYear() - 1"
            :max="new Date().getFullYear() + 1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="loadReconciliation"
            :disabled="loading"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ loading ? 'Loading...' : 'Load Reconciliation' }}
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

    <div v-else-if="reconciliation" class="space-y-6">
      <!-- Summary -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Summary</Heading>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-600">Total Bills</p>
            <p class="text-2xl font-semibold">{{ reconciliation.summary.totalBills }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Expected Total</p>
            <p class="text-2xl font-semibold text-green-600">€{{ reconciliation.summary.expectedTotal.toFixed(2) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Actual Total</p>
            <p class="text-2xl font-semibold text-blue-600">€{{ reconciliation.summary.actualTotal.toFixed(2) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Difference</p>
            <p
              :class="[
                'text-2xl font-semibold',
                Math.abs(reconciliation.summary.difference) < 0.01
                  ? 'text-gray-600'
                  : reconciliation.summary.difference > 0
                    ? 'text-red-600'
                    : 'text-green-600'
              ]"
            >
              €{{ reconciliation.summary.difference.toFixed(2) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Discrepancies -->
      <div v-if="reconciliation.discrepancies.length > 0" class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4 text-red-600">⚠️ Discrepancies ({{ reconciliation.discrepancies.length }})</Heading>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="disc in reconciliation.discrepancies"
                :key="disc.billId"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-3 text-sm text-gray-900">{{ disc.childName }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">€{{ disc.expected.toFixed(2) }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">€{{ disc.actual.toFixed(2) }}</td>
                <td class="px-4 py-3 text-sm font-medium" :class="disc.difference > 0 ? 'text-red-600' : 'text-green-600'">
                  €{{ disc.difference.toFixed(2) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ disc.issue }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Missing Attendance -->
      <div v-if="reconciliation.missingAttendance.length > 0" class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4 text-yellow-600">⚠️ Missing Attendance Records ({{ reconciliation.missingAttendance.length }})</Heading>
        <div class="space-y-2">
          <div
            v-for="missing in reconciliation.missingAttendance"
            :key="`${missing.childId}-${missing.date}`"
            class="p-3 bg-yellow-50 border border-yellow-200 rounded-md"
          >
            <p class="text-sm">
              <strong>{{ missing.childName }}</strong> - No attendance record for {{ formatDate(missing.date) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Missing Pricing -->
      <div v-if="reconciliation.missingPricing.length > 0" class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4 text-orange-600">⚠️ Missing Pricing ({{ reconciliation.missingPricing.length }})</Heading>
        <div class="space-y-2">
          <div
            v-for="missing in reconciliation.missingPricing"
            :key="missing.groupId"
            class="p-3 bg-orange-50 border border-orange-200 rounded-md"
          >
            <p class="text-sm">
              <strong>{{ missing.groupName }}</strong> - No lunch pricing configured
            </p>
            <NuxtLink
              to="/admin/lunch/pricing"
              class="text-sm text-orange-800 underline hover:text-orange-900 mt-1 inline-block"
            >
              Set up pricing →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- All Bills -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">All Bills</Heading>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="bill in reconciliation.bills"
                :key="bill.billId"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-3 text-sm text-gray-900">{{ bill.childName }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">€{{ bill.expected.toFixed(2) }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">€{{ bill.actual.toFixed(2) }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      Math.abs(bill.difference) < 0.01
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ Math.abs(bill.difference) < 0.01 ? 'Match' : 'Mismatch' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <NuxtLink
                    :to="`/admin/lunch/billing/${bill.billId}`"
                    class="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View →
                  </NuxtLink>
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
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const childrenStore = useChildrenStore()
const { children } = storeToRefs(childrenStore)

const loading = ref(false)
const error = ref('')
const reconciliation = ref<any>(null)

const filters = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear()
})

onMounted(async () => {
  await childrenStore.fetchChildren()
})

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const loadReconciliation = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/admin/lunch/billing/reconciliation', {
      method: 'GET',
      params: {
        month: filters.value.month,
        year: filters.value.year
      }
    })

    if (response.success && response.reconciliation) {
      reconciliation.value = response.reconciliation
    } else {
      throw new Error(response.message || 'Failed to load reconciliation')
    }
  } catch (e: any) {
    console.error('Error loading reconciliation:', e)
    error.value = e.data?.message || e.message || 'Failed to load reconciliation'
  } finally {
    loading.value = false
  }
}
</script>
