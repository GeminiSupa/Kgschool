<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/pricing"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Pricing
      </NuxtLink>
      <Heading size="xl">Add Lunch Pricing</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <LunchPricingForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLunchPricingStore } from '~/stores/lunchPricing'
import Heading from '~/components/ui/Heading.vue'
import LunchPricingForm from '~/components/forms/LunchPricingForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const pricingStore = useLunchPricingStore()

const handleSubmit = async (formData: any) => {
  try {
    await pricingStore.createPricing(formData)
    alert('Pricing created successfully!')
    router.push('/admin/lunch/pricing')
  } catch (error: any) {
    alert(error.message || 'Failed to create pricing')
  }
}

const handleCancel = () => {
  router.push('/admin/lunch/pricing')
}
</script>
