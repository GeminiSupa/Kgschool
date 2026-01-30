<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/fees/config"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Fee Config
      </NuxtLink>
      <Heading size="xl">Edit Fee Configuration</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="config" class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <FeeConfigForm
        :initial-data="config"
        @submit="handleUpdate"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFeeConfigStore } from '~/stores/feeConfig'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import FeeConfigForm from '~/components/forms/FeeConfigForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const feeConfigStore = useFeeConfigStore()

const configId = route.params.id as string
const loading = ref(true)
const error = ref('')
const config = ref<any>(null)

onMounted(async () => {
  try {
    await feeConfigStore.fetchConfigs()
    const found = feeConfigStore.configs.find(c => c.id === configId)
    if (!found) {
      error.value = 'Configuration not found'
      return
    }
    config.value = found
  } catch (e: any) {
    error.value = e.message || 'Failed to load configuration'
  } finally {
    loading.value = false
  }
})

const handleUpdate = async (data: any) => {
  try {
    await feeConfigStore.updateConfig(configId, data)
    alert('Fee configuration updated successfully!')
    router.push('/admin/fees/config')
  } catch (error: any) {
    alert(error.message || 'Failed to update configuration')
  }
}

const handleCancel = () => {
  router.push('/admin/fees/config')
}
</script>
