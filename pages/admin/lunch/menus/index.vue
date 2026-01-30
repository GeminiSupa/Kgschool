<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Lunch Menus</Heading>
      <NuxtLink
        to="/admin/lunch/menus/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ Add Menu
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="menus.length === 0" class="p-8 text-center text-gray-500">
        No menus created yet.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="menu in menus"
          :key="menu.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-lg font-medium text-gray-900">{{ menu.meal_name }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ menu.description }}</p>
              <p class="text-xs text-gray-500 mt-2">Date: {{ formatDate(menu.date) }}</p>
              <div v-if="menu.allergens && menu.allergens.length > 0" class="mt-2">
                <span class="text-xs text-orange-600">
                  Allergens: {{ menu.allergens.join(', ') }}
                </span>
              </div>
            </div>
            <NuxtLink
              :to="`/admin/lunch/menus/${menu.id}`"
              class="text-blue-600 hover:text-blue-700 text-sm"
            >
              View →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLunchStore } from '~/stores/lunch'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['admin', 'kitchen']
})

const lunchStore = useLunchStore()
const { menus, loading, error } = storeToRefs(lunchStore)

onMounted(async () => {
  await lunchStore.fetchMenus()
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
