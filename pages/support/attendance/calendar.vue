<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/support/attendance"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Attendance
      </NuxtLink>
      <Heading size="xl">Attendance Calendar</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <button @click="prevMonth" class="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">← Prev</button>
        <h2 class="text-lg font-medium">{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="nextMonth" class="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">Next →</button>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600 mb-2">
        <div v-for="day in daysOfWeek" :key="day">{{ day }}</div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner />
      </div>

      <div v-else-if="error" class="mb-6">
        <ErrorAlert :message="error" />
      </div>

      <div v-else class="grid grid-cols-7 gap-1">
        <div
          v-for="day in emptyDaysPrefix"
          :key="`prefix-${day}`"
          class="h-20 bg-gray-50 rounded-md"
        ></div>
        <div
          v-for="dayData in calendarDays"
          :key="dayData.date"
          :class="[
            'h-20 p-1 rounded-md border',
            dayData.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400',
            dayData.isToday ? 'ring-2 ring-blue-500' : ''
          ]"
        >
          <p class="text-xs font-medium text-right">{{ dayData.day }}</p>
          <div class="mt-1 space-y-0.5">
            <div v-if="dayData.presentCount > 0" class="flex items-center justify-end text-green-600 text-xs">
              <span>✅ {{ dayData.presentCount }}</span>
            </div>
            <div v-if="dayData.absentCount > 0" class="flex items-center justify-end text-red-600 text-xs">
              <span>❌ {{ dayData.absentCount }}</span>
            </div>
          </div>
        </div>
        <div
          v-for="day in emptyDaysSuffix"
          :key="`suffix-${day}`"
          class="h-20 bg-gray-50 rounded-md"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'support'
})

const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref('')
const currentDate = ref(new Date())
const calendarData = ref<any[]>([])

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentMonthName = computed(() => currentDate.value.toLocaleString('default', { month: 'long' }))
const currentYear = computed(() => currentDate.value.getFullYear())

const firstDayOfMonth = computed(() => new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1))
const lastDayOfMonth = computed(() => new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0))
const numDaysInMonth = computed(() => lastDayOfMonth.value.getDate())
const emptyDaysPrefix = computed(() => firstDayOfMonth.value.getDay())
const emptyDaysSuffix = computed(() => 6 - lastDayOfMonth.value.getDay())

const calendarDays = computed(() => {
  const days = []
  for (let i = 1; i <= numDaysInMonth.value; i++) {
    const date = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), i)
    const dateString = date.toISOString().split('T')[0]
    const dayData = calendarData.value.find(d => d.date === dateString) || {}

    days.push({
      day: i,
      date: dateString,
      isCurrentMonth: true,
      isToday: dateString === new Date().toISOString().split('T')[0],
      presentCount: dayData.present_count || 0,
      absentCount: dayData.absent_count || 0
    })
  }
  return days
})

onMounted(() => {
  fetchCalendarData()
})

watch(currentDate, () => {
  fetchCalendarData()
})

const fetchCalendarData = async () => {
  loading.value = true
  error.value = ''
  try {
    const startDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
      .toISOString().split('T')[0]
    const endDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0)
      .toISOString().split('T')[0]

    const { data, error: fetchError } = await supabase
      .from('attendance')
      .select('date, status')
      .gte('date', startDate)
      .lte('date', endDate)

    if (fetchError) throw fetchError

    // Group by date and count
    const grouped = (data || []).reduce((acc: any, record: any) => {
      if (!acc[record.date]) {
        acc[record.date] = { date: record.date, present_count: 0, absent_count: 0 }
      }
      if (record.status === 'present') {
        acc[record.date].present_count++
      } else if (record.status === 'absent') {
        acc[record.date].absent_count++
      }
      return acc
    }, {})

    calendarData.value = Object.values(grouped)
  } catch (e: any) {
    console.error('Error fetching calendar data:', e)
    error.value = e.message || 'Failed to load calendar data'
  } finally {
    loading.value = false
  }
}

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}
</script>
