<template>
  <div>
    <Heading size="xl" class="mb-6">My Children's Fees</Heading>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <form @submit.prevent="filterFees" class="grid grid-cols-1 md:grid-cols-3 gap-4">
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

    <div v-else class="space-y-6">
      <div v-if="groupedFees.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No fees found.
      </div>

      <div v-else class="space-y-6">
        <div
          v-for="group in groupedFees"
          :key="group.childId"
          class="bg-white rounded-lg shadow overflow-hidden"
        >
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              {{ getChildName(group.childId) }}
            </h3>
          </div>
          <div class="divide-y divide-gray-200">
            <div
              v-for="fee in group.fees"
              :key="fee.id"
              class="p-6 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {{ formatFeeType(fee.fee_type) }}
                    </span>
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
                  </div>
                  <p class="text-sm text-gray-600 mb-1">
                    {{ getMonthName(fee.month) }} {{ fee.year }}
                  </p>
                  <p class="text-lg font-bold text-gray-900">
                    €{{ fee.amount.toFixed(2) }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    Due: {{ formatDate(fee.due_date) }}
                  </p>
                </div>
                <div class="flex flex-col gap-2">
                  <NuxtLink
                    :to="`/parent/fees/${fee.id}`"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center text-sm"
                  >
                    View Details
                  </NuxtLink>
                  <button
                    v-if="fee.status === 'pending' || fee.status === 'overdue'"
                    @click="goToPay(fee.id)"
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="p-6 bg-gray-50 border-t border-gray-200">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-700">Total for {{ getChildName(group.childId) }}:</span>
              <span class="text-lg font-bold text-gray-900">
                €{{ group.total.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useMonthlyFeesStore } from '~/stores/monthlyFees'
import { useChildrenStore } from '~/stores/children'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const router = useRouter()
const monthlyFeesStore = useMonthlyFeesStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()

const { fees, loading, error } = storeToRefs(monthlyFeesStore)
const { children } = storeToRefs(childrenStore)

const filters = ref({
  month: 0,
  year: new Date().getFullYear()
})

const myChildren = computed(() => {
  if (!authStore.user?.id) return []
  return children.value.filter(c => c.parent_ids?.includes(authStore.user!.id))
})

const myFees = computed(() => {
  if (!authStore.user?.id) return []
  const childIds = myChildren.value.map(c => c.id)
  let result = fees.value.filter(f => childIds.includes(f.child_id))

  if (filters.value.month > 0) {
    result = result.filter(f => f.month === filters.value.month)
  }

  if (filters.value.year) {
    result = result.filter(f => f.year === filters.value.year)
  }

  return result
})

const groupedFees = computed(() => {
  const groups: Record<string, { childId: string; fees: any[]; total: number }> = {}

  myFees.value.forEach(fee => {
    if (!groups[fee.child_id]) {
      groups[fee.child_id] = {
        childId: fee.child_id,
        fees: [],
        total: 0
      }
    }
    groups[fee.child_id].fees.push(fee)
    groups[fee.child_id].total += fee.amount
  })

  return Object.values(groups)
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
  const child = myChildren.value.find(c => c.id === childId)
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

const goToPay = (feeId: string) => {
  router.push(`/parent/fees/${feeId}`)
}
</script>
