<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <Heading size="xl">Portfolios</Heading>
        <p class="text-sm text-gray-600 mt-1">Sammlung von Arbeiten und Erinnerungen der Kinder</p>
      </div>
      <NuxtLink
        to="/admin/portfolios/new"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        <span>➕</span>
        <span>Neues Portfolio-Element</span>
      </NuxtLink>
    </div>

    <div class="mb-4">
      <select
        v-model="selectedChildId"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchPortfolios"
      >
        <option value="">Alle Kinder</option>
        <option v-for="child in children" :key="child.id" :value="child.id">
          {{ child.first_name }} {{ child.last_name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error.message || 'Error loading portfolios'" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="portfolios.length === 0" class="p-8 text-center text-gray-500">
        No portfolio items found.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <div
          v-for="portfolio in portfolios"
          :key="portfolio.id"
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div class="mb-2">
            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              {{ portfolio.portfolio_type }}
            </span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">{{ portfolio.title }}</h3>
          <p class="text-sm text-gray-600 mb-2">{{ getChildName(portfolio.child_id) }}</p>
          <p class="text-sm text-gray-500 mb-3">{{ formatDate(portfolio.date) }}</p>
          <p v-if="portfolio.description" class="text-sm text-gray-700 mb-3 line-clamp-2">
            {{ portfolio.description }}
          </p>
          <div v-if="portfolio.attachments && portfolio.attachments.length > 0" class="mb-3">
            <span class="text-xs text-gray-500">📎 {{ portfolio.attachments.length }} attachments</span>
          </div>
          <div class="flex items-center gap-2 mt-3">
            <NuxtLink
              :to="`/admin/portfolios/${portfolio.id}`"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
            >
              <span>👁️</span>
              <span>Ansehen</span>
            </NuxtLink>
            <NuxtLink
              :to="`/admin/portfolios/${portfolio.id}?edit=true`"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors text-sm"
            >
              <span>✏️</span>
              <span>Bearbeiten</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePortfoliosStore } from '~/stores/portfolios'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const portfoliosStore = usePortfoliosStore()
const childrenStore = useChildrenStore()

const selectedChildId = ref('')
const { portfolios, loading, error } = storeToRefs(portfoliosStore)
const { children } = storeToRefs(childrenStore)

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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
