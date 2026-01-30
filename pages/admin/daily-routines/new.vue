<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/daily-routines"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Daily Routines
      </NuxtLink>
      <Heading size="xl">Create Daily Routine</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <DailyRoutineForm @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDailyRoutinesStore } from '~/stores/dailyRoutines'
import Heading from '~/components/ui/Heading.vue'
import DailyRoutineForm from '~/components/forms/DailyRoutineForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const dailyRoutinesStore = useDailyRoutinesStore()

const handleSubmit = async (data: any) => {
  try {
    await dailyRoutinesStore.createDailyRoutine(data)
    alert('Daily routine created successfully!')
    router.push('/admin/daily-routines')
  } catch (error: any) {
    alert(error.message || 'Failed to create daily routine')
  }
}

const handleCancel = () => {
  router.push('/admin/daily-routines')
}
</script>
