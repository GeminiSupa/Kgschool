<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/parent/absences"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Absences
      </NuxtLink>
      <Heading size="xl">Notify Absence</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <AbsenceNotificationForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAbsencesStore } from '~/stores/absences'
import Heading from '~/components/ui/Heading.vue'
import AbsenceNotificationForm from '~/components/forms/AbsenceNotificationForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const router = useRouter()
const absencesStore = useAbsencesStore()

const handleSubmit = async (data: any) => {
  try {
    await absencesStore.createNotification(data)
    alert('Absence notification submitted successfully!')
    router.push('/parent/absences')
  } catch (error: any) {
    alert(error.message || 'Failed to submit absence notification')
  }
}

const handleCancel = () => {
  router.push('/parent/absences')
}
</script>
