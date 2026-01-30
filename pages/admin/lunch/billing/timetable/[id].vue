<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/billing/timetable"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Timetables
      </NuxtLink>
      <Heading size="xl">Edit Billing Timetable</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <BillingTimetableForm 
        :timetable-id="route.params.id as string"
        @submit="handleSubmit" 
        @cancel="handleCancel" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBillingTimetableStore } from '~/stores/billingTimetable'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import BillingTimetableForm from '~/components/forms/BillingTimetableForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const timetableStore = useBillingTimetableStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    await timetableStore.fetchTimetableById(route.params.id as string)
  } catch (e: any) {
    error.value = e.message || 'Failed to load timetable'
  } finally {
    loading.value = false
  }
})

const handleSubmit = () => {
  router.push('/admin/lunch/billing/timetable')
}

const handleCancel = () => {
  router.push('/admin/lunch/billing/timetable')
}
</script>
