<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/teacher/daily-reports"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Daily Reports
      </NuxtLink>
      <Heading size="xl">Create Daily Report</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <DailyReportForm 
        :teacher-groups-only="true"
        @submit="handleSubmit" 
        @cancel="handleCancel" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDailyReportsStore } from '~/stores/dailyReports'
import Heading from '~/components/ui/Heading.vue'
import DailyReportForm from '~/components/forms/DailyReportForm.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const router = useRouter()
const dailyReportsStore = useDailyReportsStore()

const handleSubmit = async (data: any) => {
  try {
    await dailyReportsStore.createDailyReport(data)
    alert('Daily report created successfully!')
    router.push('/teacher/daily-reports')
  } catch (error: any) {
    alert(error.message || 'Failed to create daily report')
  }
}

const handleCancel = () => {
  router.push('/teacher/daily-reports')
}
</script>
