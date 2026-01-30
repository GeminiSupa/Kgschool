<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/portfolios"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Portfolios
      </NuxtLink>
      <Heading size="xl">Create Portfolio Item</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <PortfolioForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePortfoliosStore } from '~/stores/portfolios'
import Heading from '~/components/ui/Heading.vue'
import PortfolioForm from '~/components/forms/PortfolioForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const portfoliosStore = usePortfoliosStore()

const handleSubmit = async (data: any) => {
  try {
    await portfoliosStore.createPortfolio(data)
    alert('Portfolio item created successfully!')
    router.push('/admin/portfolios')
  } catch (error: any) {
    alert(error.message || 'Failed to create portfolio item')
  }
}

const handleCancel = () => {
  router.push('/admin/portfolios')
}
</script>
