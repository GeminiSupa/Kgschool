<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <Heading size="xl" class="mb-1">Academic Calendar</Heading>
        <p class="text-sm text-gray-500">Manage holidays, vacations, and closures</p>
      </div>
      <button
        @click="showAddForm = true"
        class="ios-button ios-button-primary inline-flex items-center gap-2"
      >
        ➕ Add Holiday/Vacation
      </button>
    </div>

    <!-- Filters -->
    <IOSCard customClass="p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-semibold text-gray-600 mb-1">Year</label>
          <select
            v-model="selectedYear"
            @change="loadHolidays"
            class="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-semibold text-gray-600 mb-1">Type</label>
          <select
            v-model="selectedType"
            @change="loadHolidays"
            class="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="holiday">Holiday</option>
            <option value="vacation">Vacation</option>
            <option value="closure">Closure</option>
            <option value="training">Training</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </IOSCard>

    <!-- Calendar View -->
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
              Today
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
                +{{ dayData.holidays.length - 2 }} more
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

    <!-- List View -->
    <IOSCard customClass="p-6">
      <Heading size="md" class="mb-4">Upcoming Holidays & Vacations</Heading>
      <div v-if="loading" class="text-center py-12">
        <LoadingSpinner />
      </div>
      <div v-else-if="error" class="mb-6">
        <ErrorAlert :message="error" />
      </div>
      <div v-else-if="holidays.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4 opacity-30">📅</div>
        <p class="text-gray-600 font-medium mb-2">No holidays scheduled</p>
        <p class="text-sm text-gray-500">Click "Add Holiday/Vacation" to create one.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="holiday in holidays"
          :key="holiday.id"
          class="p-4 bg-white rounded-xl border-2 border-gray-200 hover:shadow-md transition-all"
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
                  🔁 Recurring
                </span>
              </div>
              <p v-if="holiday.description" class="text-sm text-gray-600 mb-2">{{ holiday.description }}</p>
              <div class="flex items-center gap-4 text-sm text-gray-600">
                <span>📅 {{ formatDate(holiday.start_date) }} - {{ formatDate(holiday.end_date) }}</span>
                <span v-if="!holiday.affects_billing" class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                  No billing impact
                </span>
                <span v-if="!holiday.affects_attendance" class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                  Attendance tracked
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                @click="editHoliday(holiday)"
                class="px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                ✏️ Edit
              </button>
              <button
                @click="deleteHoliday(holiday)"
                class="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </IOSCard>

    <!-- Add/Edit Form Modal -->
    <div
      v-if="showAddForm || editingHoliday"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeForm"
    >
      <IOSCard customClass="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div class="flex items-center justify-between mb-6">
          <Heading size="lg">{{ editingHoliday ? 'Edit Holiday' : 'Add Holiday/Vacation' }}</Heading>
          <button
            @click="closeForm"
            class="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label for="title" class="block text-sm font-semibold text-gray-700 mb-2">
              Title <span class="text-red-500">*</span>
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Christmas Holidays, Summer Vacation"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Additional details about this holiday..."
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label for="start_date" class="block text-sm font-semibold text-gray-700 mb-2">
                Start Date <span class="text-red-500">*</span>
              </label>
              <input
                id="start_date"
                v-model="form.start_date"
                type="date"
                required
                class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label for="end_date" class="block text-sm font-semibold text-gray-700 mb-2">
                End Date <span class="text-red-500">*</span>
              </label>
              <input
                id="end_date"
                v-model="form.end_date"
                type="date"
                required
                :min="form.start_date"
                class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label for="holiday_type" class="block text-sm font-semibold text-gray-700 mb-2">
              Type <span class="text-red-500">*</span>
            </label>
            <select
              id="holiday_type"
              v-model="form.holiday_type"
              required
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="holiday">Holiday</option>
              <option value="vacation">Vacation</option>
              <option value="closure">Closure</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                id="is_recurring"
                v-model="form.is_recurring"
                type="checkbox"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label for="is_recurring" class="text-sm font-medium text-gray-700">
                Recurring (e.g., yearly)
              </label>
            </div>

            <div v-if="form.is_recurring">
              <label for="recurring_pattern" class="block text-sm font-semibold text-gray-700 mb-2">
                Recurring Pattern
              </label>
              <select
                id="recurring_pattern"
                v-model="form.recurring_pattern"
                class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                id="affects_billing"
                v-model="form.affects_billing"
                type="checkbox"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label for="affects_billing" class="text-sm font-medium text-gray-700">
                Affects Billing (no charges on these days)
              </label>
            </div>

            <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                id="affects_attendance"
                v-model="form.affects_attendance"
                type="checkbox"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label for="affects_attendance" class="text-sm font-medium text-gray-700">
                Affects Attendance (no attendance tracking)
              </label>
            </div>
          </div>

          <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {{ error }}
          </div>

          <div class="flex gap-3 justify-end pt-4">
            <button
              type="button"
              @click="closeForm"
              class="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {{ submitting ? '⏳ Saving...' : (editingHoliday ? '✅ Update' : '✅ Create') }}
            </button>
          </div>
        </form>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const submitting = ref(false)
const showAddForm = ref(false)
const editingHoliday = ref<any>(null)
const holidays = ref<any[]>([])
const selectedYear = ref(new Date().getFullYear())
const selectedType = ref('')
const currentDate = ref(new Date())

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const emptyDaysPrefix = ref<any[]>([])
const emptyDaysSuffix = ref<any[]>([])
const calendarDays = ref<any[]>([])

const availableYears = computed(() => {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear - 1; i <= currentYear + 2; i++) {
    years.push(i)
  }
  return years
})

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleString('default', { month: 'long' })
})

const currentYear = computed(() => {
  return currentDate.value.getFullYear()
})

const form = ref({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  holiday_type: 'vacation',
  is_recurring: false,
  recurring_pattern: 'yearly',
  affects_billing: true,
  affects_attendance: true
})

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
    const startDate = `${selectedYear.value}-01-01`
    const endDate = `${selectedYear.value}-12-31`
    
    let query = supabase
      .from('academic_calendar')
      .select('*')
      .gte('end_date', startDate)
      .lte('start_date', endDate)
      .order('start_date', { ascending: true })

    if (selectedType.value) {
      query = query.eq('holiday_type', selectedType.value)
    }

    const { data, error: err } = await query
    if (err) throw err
    holidays.value = data || []
  } catch (e: any) {
    error.value = e.message || 'Failed to load holidays'
    console.error('Error loading holidays:', e)
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
  generateCalendar()
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  generateCalendar()
}

const goToToday = () => {
  currentDate.value = new Date()
  generateCalendar()
}

const handleSubmit = async () => {
  submitting.value = true
  error.value = ''
  try {
    const formData = {
      ...form.value,
      created_by: authStore.user?.id
    }

    if (editingHoliday.value) {
      const { error: err } = await supabase
        .from('academic_calendar')
        .update(formData)
        .eq('id', editingHoliday.value.id)
      if (err) throw err
    } else {
      const { error: err } = await supabase
        .from('academic_calendar')
        .insert([formData])
      if (err) throw err
    }

    await loadHolidays()
    closeForm()
  } catch (e: any) {
    error.value = e.message || 'Failed to save holiday'
    console.error('Error saving holiday:', e)
  } finally {
    submitting.value = false
  }
}

const editHoliday = (holiday: any) => {
  editingHoliday.value = holiday
  form.value = {
    title: holiday.title,
    description: holiday.description || '',
    start_date: holiday.start_date,
    end_date: holiday.end_date,
    holiday_type: holiday.holiday_type,
    is_recurring: holiday.is_recurring || false,
    recurring_pattern: holiday.recurring_pattern || 'yearly',
    affects_billing: holiday.affects_billing !== false,
    affects_attendance: holiday.affects_attendance !== false
  }
  showAddForm.value = true
}

const deleteHoliday = async (holiday: any) => {
  if (!confirm(`Are you sure you want to delete "${holiday.title}"?`)) return

  try {
    const { error: err } = await supabase
      .from('academic_calendar')
      .delete()
      .eq('id', holiday.id)
    if (err) throw err
    await loadHolidays()
  } catch (e: any) {
    error.value = e.message || 'Failed to delete holiday'
    console.error('Error deleting holiday:', e)
  }
}

const closeForm = () => {
  showAddForm.value = false
  editingHoliday.value = null
  form.value = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    holiday_type: 'vacation',
    is_recurring: false,
    recurring_pattern: 'yearly',
    affects_billing: true,
    affects_attendance: true
  }
  error.value = ''
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
    holiday: 'Holiday',
    vacation: 'Vacation',
    closure: 'Closure',
    training: 'Training',
    other: 'Other'
  }
  return types[type] || type
}
</script>
