<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Fee Configuration</Heading>
      <div class="flex gap-2">
        <NuxtLink
          to="/admin/fees/config/new"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ New Config
        </NuxtLink>
        <NuxtLink
          to="/admin/fees"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ← Back to Fees
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
        No fee configurations found.
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Period</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="config in configs" :key="config.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ formatFeeType(config.fee_type) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ config.group_id ? getGroupName(config.group_id) : 'All Groups' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              €{{ config.amount.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(config.effective_from) }}
              <span v-if="config.effective_to"> - {{ formatDate(config.effective_to) }}</span>
              <span v-else class="text-green-600"> (Active)</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <NuxtLink
                :to="`/admin/fees/config/${config.id}`"
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
import { useFeeConfigStore } from '~/stores/feeConfig'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const feeConfigStore = useFeeConfigStore()
const groupsStore = useGroupsStore()

const { configs, loading, error } = storeToRefs(feeConfigStore)
const { groups } = storeToRefs(groupsStore)

onMounted(async () => {
  try {
    await Promise.all([
      feeConfigStore.fetchConfigs(),
      groupsStore.fetchGroups()
    ])
  } catch (e: any) {
    console.error('Error loading fee configs:', e)
  }
})

const getGroupName = (groupId: string) => {
  const group = groups.value.find(g => g.id === groupId)
  return group?.name || groupId
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
