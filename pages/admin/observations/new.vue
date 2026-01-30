<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/observations"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Observations
      </NuxtLink>
      <Heading size="xl">Create Observation</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <ObservationForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useObservationsStore } from '~/stores/observations'
import Heading from '~/components/ui/Heading.vue'
import ObservationForm from '~/components/forms/ObservationForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const observationsStore = useObservationsStore()

const handleSubmit = async (data: any) => {
  try {
    await observationsStore.createObservation(data)
    alert('Observation created successfully!')
    router.push('/admin/observations')
  } catch (error: any) {
    alert(error.message || 'Failed to create observation')
  }
}

const handleCancel = () => {
  router.push('/admin/observations')
}
</script>
