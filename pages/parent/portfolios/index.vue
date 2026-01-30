<template>
  <div>
    <div class="mb-6">
      <Heading size="xl">Portfolios</Heading>
      <p class="text-sm text-gray-600 mt-1">Sammlung von Arbeiten und Erinnerungen Ihrer Kinder</p>
    </div>

    <div class="mb-4">
      <select
        v-model="selectedChildId"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchPortfolios"
      >
        <option value="">Alle meine Kinder</option>
        <option v-for="child in myChildren" :key="child.id" :value="child.id">
          {{ child.first_name }} {{ child.last_name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error.message || 'Fehler beim Laden der Portfolios'" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="portfolios.length === 0" class="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Keine Portfolio-Elemente gefunden.
      </div>

      <div
        v-for="portfolio in portfolios"
        :key="portfolio.id"
        class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div v-if="portfolio.attachments && portfolio.attachments.length > 0" class="aspect-video bg-gray-100">
          <img
            :src="portfolio.attachments[0]"
            :alt="portfolio.title"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="p-5">
          <div class="mb-2">
            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              {{ getPortfolioTypeLabel(portfolio.portfolio_type) }}
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ portfolio.title }}</h3>
          <p class="text-sm text-gray-600 mb-2">{{ getChildName(portfolio.child_id) }}</p>
          <p class="text-sm text-gray-500 mb-3">{{ formatDate(portfolio.date) }}</p>
          <p v-if="portfolio.description" class="text-sm text-gray-700 mb-4 line-clamp-2">
            {{ portfolio.description }}
          </p>
          <div v-if="portfolio.attachments && portfolio.attachments.length > 0" class="mb-4">
            <span class="text-xs text-gray-500">📎 {{ portfolio.attachments.length }} Anhänge</span>
          </div>
          <NuxtLink
            :to="`/parent/portfolios/${portfolio.id}`"
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
          >
            <span>👁️</span>
            <span>Vollständig ansehen</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePortfoliosStore } from '~/stores/portfolios'
import { useChildrenStore } from '~/stores/children'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const portfoliosStore = usePortfoliosStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()

const selectedChildId = ref('')
const { portfolios, loading, error } = storeToRefs(portfoliosStore)
const { children } = storeToRefs(childrenStore)

const myChildren = computed(() => {
  const userId = authStore.user?.id
  if (!userId) return []
  
  return children.value.filter(child => child.parent_ids?.includes(userId))
})

const filteredPortfolios = computed(() => {
  const myChildIds = myChildren.value.map(c => c.id)
  let filtered = portfolios.value.filter(portfolio => myChildIds.includes(portfolio.child_id))
  
  if (selectedChildId.value) {
    filtered = filtered.filter(portfolio => portfolio.child_id === selectedChildId.value)
  }
  
  return filtered.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})

onMounted(async () => {
  await Promise.all([
    portfoliosStore.fetchPortfolios(),
    childrenStore.fetchChildren()
  ])
})

const fetchPortfolios = async () => {
  await portfoliosStore.fetchPortfolios(selectedChildId.value || undefined)
}

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const getPortfolioTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    artwork: 'Kunstwerk',
    photo: 'Foto',
    achievement: 'Leistung',
    activity: 'Aktivität',
    milestone: 'Meilenstein',
    other: 'Sonstiges'
  }
  return labels[type] || type
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE')
}
</script>
