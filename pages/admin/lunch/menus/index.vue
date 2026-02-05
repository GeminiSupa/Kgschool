<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="ios-page-header">
        <div class="flex justify-between items-center">
          <div>
            <h1>Mittagessen-Menüs</h1>
          </div>
          <NuxtLink
            to="/admin/lunch/menus/new"
            class="ios-button ios-button-primary inline-flex items-center gap-2"
          >
            ➕ Menü hinzufügen
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else>
      <IOSCard customClass="overflow-hidden">
        <div v-if="menus.length === 0" class="p-8 text-center text-gray-600">
          <div class="text-6xl mb-4 opacity-50">🍽️</div>
          <p class="text-lg font-semibold text-gray-900 mb-2">Noch keine Menüs erstellt</p>
          <p class="text-sm text-gray-600">Erstellen Sie Ihr erstes Menü, um zu beginnen.</p>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="menu in menus"
            :key="menu.id"
            class="p-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-lg font-semibold text-gray-900">{{ menu.meal_name }}</p>
                <p class="text-sm text-gray-700 mt-1">{{ menu.description }}</p>
                <p class="text-xs text-gray-600 mt-2">Datum: {{ formatDate(menu.date) }}</p>
                <div v-if="menu.allergens && menu.allergens.length > 0" class="mt-2">
                  <span class="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Allergene: {{ menu.allergens.join(', ') }}
                  </span>
                </div>
              </div>
              <div class="flex gap-3">
                <NuxtLink
                  :to="`/admin/lunch/menus/${menu.id}`"
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ansehen →
                </NuxtLink>
                <NuxtLink
                  :to="`/admin/lunch/menus/${menu.id}/edit`"
                  class="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  ✏️ Bearbeiten
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLunchStore } from '~/stores/lunch'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['admin', 'kitchen']
})

const lunchStore = useLunchStore()
const { getUserKitaId } = useKita()
const { menus, loading, error } = storeToRefs(lunchStore)

onMounted(async () => {
  const kitaId = await getUserKitaId()
  await lunchStore.fetchMenus(undefined, undefined, kitaId || undefined)
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
