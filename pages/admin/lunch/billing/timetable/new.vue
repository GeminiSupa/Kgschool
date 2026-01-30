<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/billing/timetable"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Timetables
      </NuxtLink>
      <Heading size="xl">New Billing Timetable</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <BillingTimetableForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Heading from '~/components/ui/Heading.vue'
import BillingTimetableForm from '~/components/forms/BillingTimetableForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()

const handleSubmit = () => {
  router.push('/admin/lunch/billing/timetable')
}

const handleCancel = () => {
  router.push('/admin/lunch/billing/timetable')
}
</script>
