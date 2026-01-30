<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/pricing"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Pricing
      </NuxtLink>
      <Heading size="xl">Edit Lunch Pricing</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="pricing" class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <LunchPricingForm :pricing="pricing" @submit="handleSubmit" @cancel="handleCancel" />
      
      <div class="mt-6 pt-6 border-t">
        <button
          @click="handleDelete"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Delete Pricing
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLunchPricingStore } from '~/stores/lunchPricing'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import LunchPricingForm from '~/components/forms/LunchPricingForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const pricingStore = useLunchPricingStore()

const loading = ref(true)
const error = ref('')
const pricing = ref<any>(null)

onMounted(async () => {
  try {
    const pricingData = await pricingStore.fetchPricingById(route.params.id as string)
    if (!pricingData) {
      error.value = 'Pricing not found'
      return
    }
    pricing.value = pricingData
  } catch (e: any) {
    error.value = e.message || 'Failed to load pricing'
  } finally {
    loading.value = false
  }
})

const handleSubmit = async (formData: any) => {
  try {
    await pricingStore.updatePricing(route.params.id as string, formData)
    alert('Pricing updated successfully!')
    router.push('/admin/lunch/pricing')
  } catch (error: any) {
    alert(error.message || 'Failed to update pricing')
  }
}

const handleCancel = () => {
  router.push('/admin/lunch/pricing')
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this pricing rule?')) return

  try {
    await pricingStore.deletePricing(route.params.id as string)
    alert('Pricing deleted successfully!')
    router.push('/admin/lunch/pricing')
  } catch (error: any) {
    alert(error.message || 'Failed to delete pricing')
  }
}
</script>
