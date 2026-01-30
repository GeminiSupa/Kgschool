<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/fees/config"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Fee Config
      </NuxtLink>
      <Heading size="xl">Create Fee Configuration</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <FeeConfigForm
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useFeeConfigStore } from '~/stores/feeConfig'
import Heading from '~/components/ui/Heading.vue'
import FeeConfigForm from '~/components/forms/FeeConfigForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const feeConfigStore = useFeeConfigStore()

const handleSubmit = async (data: any) => {
  try {
    await feeConfigStore.createConfig(data)
    alert('Fee configuration created successfully!')
    router.push('/admin/fees/config')
  } catch (error: any) {
    alert(error.message || 'Failed to create configuration')
  }
}

const handleCancel = () => {
  router.push('/admin/fees/config')
}
</script>
