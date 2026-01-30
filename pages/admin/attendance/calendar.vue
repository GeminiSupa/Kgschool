<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Attendance Calendar</Heading>
      <div class="flex gap-2">
        <button
          @click="previousMonth"
          class="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          ← Previous
        </button>
        <button
          @click="nextMonth"
          class="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Next →
        </button>
        <button
          @click="currentMonth"
          class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Today
        </button>
      </div>
    </div>

    <div class="mb-4 flex gap-4 items-center">
      <select
        v-model="selectedGroupId"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="loadCalendar"
      >
        <option value="">All Groups</option>
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
      <select
        v-model="selectedChildId"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="loadCalendar"
      >
        <option value="">All Children</option>
        <option v-for="child in filteredChildren" :key="child.id" :value="child.id">
          {{ child.first_name }} {{ child.last_name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Calendar Header -->
      <div class="p-4 bg-gray-50 border-b">
        <h2 class="text-xl font-semibold text-center">
          {{ getMonthName(currentMonthNum) }} {{ currentYear }}
        </h2>
      </div>

      <!-- Calendar Grid -->
      <div class="p-4">
        <!-- Day Headers -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div
            v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
            :key="day"
            class="text-center text-sm font-medium text-gray-600 py-2"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            :class="[
              'min-h-[100px] p-2 border border-gray-200 rounded',
              day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
              day.isToday ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <div class="flex items-center justify-between mb-1">
              <span
                :class="[
                  'text-sm font-medium',
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                  day.isToday ? 'text-blue-600' : ''
                ]"
              >
                {{ day.day }}
              </span>
              <span
                v-if="day.billable"
                class="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded"
                title="Billable day"
              >
                €
              </span>
            </div>
            <div class="space-y-1">
              <div
                v-for="record in day.records"
                :key="record.id"
                :class="[
                  'text-xs p-1 rounded',
                  record.status === 'present' ? 'bg-green-100 text-green-800' :
                  record.status === 'absent' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                ]"
                :title="`${record.childName}: ${record.status}`"
              >
                {{ record.childName.substring(0, 8) }}: {{ record.status.substring(0, 1).toUpperCase() }}
              </div>
              <div
                v-if="day.hasLunchOrder"
                class="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded"
                title="Lunch order"
              >
                🍽️
              </div>
              <div
                v-if="day.hasInformedAbsence"
                class="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 rounded"
                title="Informed absence (refundable)"
              >
                📝
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="p-4 bg-gray-50 border-t">
        <div class="flex flex-wrap gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Present</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Absent</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Late/Early Pickup</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded">€</span>
            <span>Billable Day</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded">🍽️</span>
            <span>Lunch Order</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 rounded">📝</span>
            <span>Informed Absence (Refundable)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import { useChildrenStore } from '~/stores/children'
import { useAttendanceStore } from '~/stores/attendance'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const groupsStore = useGroupsStore()
const childrenStore = useChildrenStore()
const attendanceStore = useAttendanceStore()

const { groups } = storeToRefs(groupsStore)
const { children } = storeToRefs(childrenStore)

const loading = ref(true)
const error = ref('')
const selectedGroupId = ref('')
const selectedChildId = ref('')
const currentDate = ref(new Date())
const calendarDays = ref<any[]>([])
const attendanceData = ref<any[]>([])
const lunchOrders = ref<any[]>([])
const absenceNotifications = ref<any[]>([])

const currentMonthNum = computed(() => currentDate.value.getMonth() + 1)
const currentYear = computed(() => currentDate.value.getFullYear())

const filteredChildren = computed(() => {
  if (!selectedGroupId.value) return children.value
  return children.value.filter(c => c.group_id === selectedGroupId.value)
})

onMounted(async () => {
  await Promise.all([
    groupsStore.fetchGroups(),
    childrenStore.fetchChildren()
  ])
  await loadCalendar()
})

watch([selectedGroupId, selectedChildId], () => {
  loadCalendar()
})

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadCalendar()
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  loadCalendar()
}

const currentMonth = () => {
  currentDate.value = new Date()
  loadCalendar()
}

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const loadCalendar = async () => {
  loading.value = true
  error.value = ''

  try {
    const startDate = new Date(currentYear.value, currentMonthNum.value - 1, 1)
    const endDate = new Date(currentYear.value, currentMonthNum.value, 0)

    // Build query for attendance
    let attendanceQuery = supabase
      .from('attendance')
      .select('*, children!inner(first_name, last_name, group_id)')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])

    if (selectedChildId.value) {
      attendanceQuery = attendanceQuery.eq('child_id', selectedChildId.value)
    } else if (selectedGroupId.value) {
      attendanceQuery = attendanceQuery.eq('children.group_id', selectedGroupId.value)
    }

    const { data: attendance, error: attendanceError } = await attendanceQuery

    if (attendanceError) throw attendanceError
    attendanceData.value = attendance || []

    // Load lunch orders
    let ordersQuery = supabase
      .from('lunch_orders')
      .select('*, lunch_menus!inner(date), children!inner(id, group_id)')
      .gte('lunch_menus.date', startDate.toISOString().split('T')[0])
      .lte('lunch_menus.date', endDate.toISOString().split('T')[0])
      .neq('status', 'cancelled')

    if (selectedChildId.value) {
      ordersQuery = ordersQuery.eq('child_id', selectedChildId.value)
    } else if (selectedGroupId.value) {
      ordersQuery = ordersQuery.eq('children.group_id', selectedGroupId.value)
    }

    const { data: orders, error: ordersError } = await ordersQuery
    if (ordersError) throw ordersError
    lunchOrders.value = orders || []

    // Load absence notifications
    let absencesQuery = supabase
      .from('absence_notifications')
      .select('*, children!inner(id, group_id)')
      .gte('absence_date', startDate.toISOString().split('T')[0])
      .lte('absence_date', endDate.toISOString().split('T')[0])
      .eq('deadline_met', true)

    if (selectedChildId.value) {
      absencesQuery = absencesQuery.eq('child_id', selectedChildId.value)
    } else if (selectedGroupId.value) {
      absencesQuery = absencesQuery.eq('children.group_id', selectedGroupId.value)
    }

    const { data: absences, error: absencesError } = await absencesQuery
    if (absencesError) throw absencesError
    absenceNotifications.value = absences || []

    // Build calendar
    buildCalendar()
  } catch (e: any) {
    console.error('Error loading calendar:', e)
    error.value = e.message || 'Failed to load calendar'
  } finally {
    loading.value = false
  }
}

const buildCalendar = async () => {
  const year = currentYear.value
  const month = currentMonthNum.value - 1
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay()) // Start from Sunday

  const days: any[] = []
  const current = new Date(startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 42; i++) {
    const dateStr = current.toISOString().split('T')[0]
    const isCurrentMonth = current.getMonth() === month
    const isToday = current.getTime() === today.getTime()

    // Get attendance records for this day
    const dayRecords = attendanceData.value
      .filter(a => a.date === dateStr)
      .map(a => ({
        id: a.id,
        childId: a.child_id,
        childName: `${a.children.first_name} ${a.children.last_name}`,
        status: a.status
      }))

    // Check for lunch orders
    const dayOrders = lunchOrders.value.filter(o => o.lunch_menus.date === dateStr)
    const hasLunchOrder = dayOrders.length > 0

    // Check for informed absences
    const dayAbsences = absenceNotifications.value.filter(a => a.absence_date === dateStr)
    const hasInformedAbsence = dayAbsences.length > 0

    // Check if billable (simplified - would need group info for accurate check)
    let billable = false
    if (isCurrentMonth && current.getDay() !== 0 && current.getDay() !== 6) {
      // Check if any child has order or was present
      billable = hasLunchOrder || dayRecords.some(r => r.status === 'present')
    }

    days.push({
      date: dateStr,
      day: current.getDate(),
      isCurrentMonth,
      isToday,
      records: dayRecords,
      hasLunchOrder,
      hasInformedAbsence,
      billable
    })

    current.setDate(current.getDate() + 1)
  }

  calendarDays.value = days
}
</script>
