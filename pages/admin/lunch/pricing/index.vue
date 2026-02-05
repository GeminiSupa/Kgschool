<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Lunch Pricing</Heading>
      <NuxtLink
        to="/admin/lunch/pricing/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ Add Pricing
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="pricing.length === 0" class="p-8 text-center text-gray-500">
        No pricing rules created yet.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="price in pricing"
          :key="price.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-lg font-medium text-gray-900">
                {{ getGroupName(price.group_id) }}
              </p>
              <p class="text-sm text-gray-600 mt-1">
                €{{ price.price_per_meal.toFixed(2) }} per meal
              </p>
              <p class="text-xs text-gray-500 mt-2">
                Effective: {{ formatDate(price.effective_from) }}
                <span v-if="price.effective_to">
                  - {{ formatDate(price.effective_to) }}
                </span>
                <span v-else class="text-green-600"> (Current)</span>
              </p>
            </div>
            <div class="flex gap-2">
              <NuxtLink
                :to="`/admin/lunch/pricing/${price.id}`"
                class="text-blue-600 hover:text-blue-700 text-sm"
              >
                Edit →
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLunchPricingStore } from '~/stores/lunchPricing'
import { useGroupsStore } from '~/stores/groups'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const pricingStore = useLunchPricingStore()
const groupsStore = useGroupsStore()
const { getUserKitaId } = useKita()

const { pricing, loading, error } = storeToRefs(pricingStore)
const { groups } = storeToRefs(groupsStore)

onMounted(async () => {
  const kitaId = await getUserKitaId()
  await Promise.all([
    pricingStore.fetchPricing(kitaId || undefined),
    groupsStore.fetchGroups(kitaId || undefined)
  ])
})

const getGroupName = (groupId: string) => {
  const group = groups.value.find(g => g.id === groupId)
  return group ? group.name : groupId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
