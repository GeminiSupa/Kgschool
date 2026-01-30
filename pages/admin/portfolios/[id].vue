<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/portfolios"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Portfolios
      </NuxtLink>
      <Heading size="xl">Portfolio Item</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="!portfolio" class="p-8 text-center text-gray-500">
      Portfolio item not found.
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-500">Title</h3>
          <p class="mt-1 text-lg text-gray-900">{{ portfolio.title }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Child</h3>
          <p class="mt-1 text-gray-900">{{ getChildName(portfolio.child_id) }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Type</h3>
          <p class="mt-1 text-gray-900">{{ portfolio.portfolio_type }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Date</h3>
          <p class="mt-1 text-gray-900">{{ formatDate(portfolio.date) }}</p>
        </div>

        <div v-if="portfolio.description">
          <h3 class="text-sm font-medium text-gray-500">Description</h3>
          <p class="mt-1 text-gray-900">{{ portfolio.description }}</p>
        </div>

        <div v-if="portfolio.content">
          <h3 class="text-sm font-medium text-gray-500">Content</h3>
          <p class="mt-1 text-gray-900 whitespace-pre-wrap">{{ portfolio.content }}</p>
        </div>

        <div v-if="portfolio.attachments && portfolio.attachments.length > 0" class="mt-4">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Attachments</h3>
          <div class="grid grid-cols-3 gap-2">
            <img
              v-for="attachment in portfolio.attachments"
              :key="attachment"
              :src="attachment"
              alt="Portfolio attachment"
              class="w-full h-32 object-cover rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { usePortfoliosStore } from '~/stores/portfolios'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const portfoliosStore = usePortfoliosStore()
const childrenStore = useChildrenStore()

const loading = ref(true)
const portfolio = ref<any>(null)

const { children } = storeToRefs(childrenStore)

onMounted(async () => {
  try {
    const portfolioId = route.params.id as string
    await portfoliosStore.fetchPortfolios()
    portfolio.value = portfoliosStore.portfolios.find(p => p.id === portfolioId)
    await childrenStore.fetchChildren()
  } finally {
    loading.value = false
  }
})

const getChildName = (childId: string) => {
  const child = children.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
