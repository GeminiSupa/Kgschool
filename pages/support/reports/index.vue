<template>
  <div>
    <Heading size="xl" class="mb-6">Attendance Reports</Heading>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <form @submit.prevent="generateReport" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            v-model="reportForm.startDate"
            type="date"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            v-model="reportForm.endDate"
            type="date"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex items-end">
          <button
            type="submit"
            :disabled="generating"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ generating ? 'Generating...' : 'Generate Report' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="reportData" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Summary</Heading>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="p-4 bg-blue-50 rounded-md">
            <p class="text-sm text-gray-600">Total Days</p>
            <p class="text-2xl font-bold text-gray-900">{{ reportData.totalDays }}</p>
          </div>
          <div class="p-4 bg-green-50 rounded-md">
            <p class="text-sm text-gray-600">Present Days</p>
            <p class="text-2xl font-bold text-gray-900">{{ reportData.presentDays }}</p>
          </div>
          <div class="p-4 bg-red-50 rounded-md">
            <p class="text-sm text-gray-600">Absent Days</p>
            <p class="text-2xl font-bold text-gray-900">{{ reportData.absentDays }}</p>
          </div>
          <div class="p-4 bg-yellow-50 rounded-md">
            <p class="text-sm text-gray-600">Attendance Rate</p>
            <p class="text-2xl font-bold text-gray-900">{{ reportData.attendanceRate }}%</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <Heading size="md" class="p-6 border-b">Daily Breakdown</Heading>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="day in reportData.dailyBreakdown" :key="day.date" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(day.date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{{ day.present }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">{{ day.absent }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ day.rate }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'support'
})

const supabase = useSupabaseClient()
const loading = ref(false)
const error = ref('')
const generating = ref(false)
const reportData = ref<any>(null)

const reportForm = ref({
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
})

const generateReport = async () => {
  generating.value = true
  error.value = ''
  reportData.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('attendance')
      .select('date, status')
      .gte('date', reportForm.value.startDate)
      .lte('date', reportForm.value.endDate)

    if (fetchError) throw fetchError

    // Calculate summary
    const totalRecords = data?.length || 0
    const presentDays = data?.filter(a => a.status === 'present').length || 0
    const absentDays = data?.filter(a => a.status === 'absent').length || 0
    const uniqueDates = [...new Set(data?.map(a => a.date) || [])]
    const totalDays = uniqueDates.length

    // Daily breakdown
    const dailyBreakdown = uniqueDates.map(date => {
      const dayRecords = data?.filter(a => a.date === date) || []
      const present = dayRecords.filter(a => a.status === 'present').length
      const absent = dayRecords.filter(a => a.status === 'absent').length
      const total = dayRecords.length
      const rate = total > 0 ? Math.round((present / total) * 100) : 0

      return { date, present, absent, total, rate }
    }).sort((a, b) => a.date.localeCompare(b.date))

    reportData.value = {
      totalDays,
      presentDays,
      absentDays,
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
      dailyBreakdown
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to generate report'
  } finally {
    generating.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  generateReport()
})
</script>
