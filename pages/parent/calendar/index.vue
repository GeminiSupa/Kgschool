<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <Heading size="xl" class="mb-1">Kita-Kalender</Heading>
        <p class="text-sm text-gray-500">Nur Ansicht – Ferien, Schließtage und wichtige Termine</p>
      </div>
    </div>

    <!-- Calendar View (read-only) -->
    <IOSCard customClass="p-6 mb-6">
      <div class="mb-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">{{ currentMonthName }} {{ currentYear }}</h3>
          <div class="flex gap-2">
            <button
              @click="previousMonth"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <button
              @click="goToToday"
              class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Heute
            </button>
            <button
              @click="nextMonth"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              →
            </button>
          </div>
        </div>
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div
            v-for="day in daysOfWeek"
            :key="day"
            class="text-center text-xs font-semibold text-gray-600 py-2"
          >
            {{ day }}
          </div>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="day in emptyDaysPrefix"
            :key="`prefix-${day}`"
            class="h-20 bg-gray-50 rounded-lg"
          ></div>
          <div
            v-for="dayData in calendarDays"
            :key="dayData.date"
            :class="[
              'h-20 p-1 rounded-lg border-2 transition-all',
              dayData.isCurrentMonth ? 'bg-white' : 'bg-gray-50 opacity-50',
              dayData.isToday ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200',
              dayData.isHoliday ? 'bg-red-50 border-red-300' : ''
            ]"
          >
            <div class="flex items-start justify-between">
              <span :class="['text-sm font-semibold', dayData.isToday ? 'text-blue-600' : 'text-gray-900']">
                {{ dayData.day }}
              </span>
              <span v-if="dayData.isHoliday" class="text-xs text-red-600">🎉</span>
            </div>
            <div v-if="dayData.holidays.length > 0" class="mt-1 space-y-0.5">
              <div
                v-for="holiday in dayData.holidays.slice(0, 2)"
                :key="holiday.id"
                :class="[
                  'text-xs px-1 py-0.5 rounded truncate',
                  holiday.holiday_type === 'vacation' ? 'bg-blue-100 text-blue-700' :
                  holiday.holiday_type === 'holiday' ? 'bg-red-100 text-red-700' :
                  holiday.holiday_type === 'closure' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                ]"
                :title="holiday.title"
              >
                {{ holiday.title }}
              </div>
              <div v-if="dayData.holidays.length > 2" class="text-xs text-gray-500">
                +{{ dayData.holidays.length - 2 }} weitere
              </div>
            </div>
          </div>
          <div
            v-for="day in emptyDaysSuffix"
            :key="`suffix-${day}`"
            class="h-20 bg-gray-50 rounded-lg"
          ></div>
        </div>
      </div>
    </IOSCard>

    <!-- Upcoming list (read-only) -->
    <IOSCard customClass="p-6">
      <Heading size="md" class="mb-4">Bevorstehende Ferien & Schließtage</Heading>
      <div v-if="loading" class="text-center py-12">
        <LoadingSpinner />
      </div>
      <div v-else-if="error" class="mb-6">
        <ErrorAlert :message="error" />
      </div>
      <div v-else-if="holidays.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4 opacity-30">📅</div>
        <p class="text-gray-600 font-medium mb-2">Keine Termine im Kalender</p>
        <p class="text-sm text-gray-500">Neue Einträge werden von der Kita-Leitung hinzugefügt.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="holiday in holidays"
          :key="holiday.id"
          class="p-4 bg-white rounded-xl border-2 border-gray-200"
          :class="{
            'border-red-300 bg-red-50/30': holiday.holiday_type === 'holiday',
            'border-blue-300 bg-blue-50/30': holiday.holiday_type === 'vacation',
            'border-gray-300 bg-gray-50/30': holiday.holiday_type === 'closure'
          }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="font-bold text-lg text-gray-900">{{ holiday.title }}</h4>
                <span
                  :class="[
                    'px-2.5 py-1 text-xs font-semibold rounded-full',
                    holiday.holiday_type === 'vacation' ? 'bg-blue-500 text-white' :
                    holiday.holiday_type === 'holiday' ? 'bg-red-500 text-white' :
                    holiday.holiday_type === 'closure' ? 'bg-gray-500 text-white' :
                    'bg-yellow-500 text-white'
                  ]"
                >
                  {{ formatHolidayType(holiday.holiday_type) }}
                </span>
                <span v-if="holiday.is_recurring" class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                  🔁 Wiederkehrend
                </span>
              </div>
              <p v-if="holiday.description" class="text-sm text-gray-600 mb-2">{{ holiday.description }}</p>
              <div class="flex items-center gap-4 text-sm text-gray-600">
                <span>📅 {{ formatDate(holiday.start_date) }} - {{ formatDate(holiday.end_date) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IOSCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'
import IOSCard from '~/components/ui/IOSCard.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const supabase = useSupabaseClient()

const loading = ref(false)
const error = ref('')
const holidays = ref<any[]>([])
const currentDate = ref(new Date())

const daysOfWeek = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const emptyDaysPrefix = ref<any[]>([])
const emptyDaysSuffix = ref<any[]>([])
const calendarDays = ref<any[]>([])

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleString('de-DE', { month: 'long' })
})

const currentYear = computed(() => currentDate.value.getFullYear())

onMounted(async () => {
  await loadHolidays()
  generateCalendar()
})

watch([currentDate, holidays], () => {
  generateCalendar()
}, { deep: true })

const loadHolidays = async () => {
  loading.value = true
  error.value = ''
  try {
    const year = currentDate.value.getFullYear()
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error: err } = await supabase
      .from('academic_calendar')
      .select('*')
      .gte('end_date', startDate)
      .lte('start_date', endDate)
      .order('start_date', { ascending: true })

    if (err) throw err
    holidays.value = data || []
  } catch (e: any) {
    console.error('Error loading holidays (parent view):', e)
    error.value = e.message || 'Kalender konnte nicht geladen werden'
  } finally {
    loading.value = false
  }
}

const generateCalendar = () => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  emptyDaysPrefix.value = Array(startingDayOfWeek).fill(null)
  const totalCells = 42
  const usedCells = daysInMonth + startingDayOfWeek
  emptyDaysSuffix.value = Array(Math.max(0, totalCells - usedCells)).fill(null)
  calendarDays.value = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    const dayHolidays = holidays.value.filter(h => 
      dateStr >= h.start_date && dateStr <= h.end_date
    )

    calendarDays.value.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === new Date().toISOString().split('T')[0],
      isHoliday: dayHolidays.length > 0,
      holidays: dayHolidays
    })
  }
}

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadHolidays()
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  loadHolidays()
}

const goToToday = () => {
  currentDate.value = new Date()
  loadHolidays()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatHolidayType = (type: string) => {
  const types: Record<string, string> = {
    holiday: 'Feiertag',
    vacation: 'Ferien',
    closure: 'Schließtag',
    training: 'Fortbildung',
    other: 'Sonstiges'
  }
  return types[type] || type
}
</script>
