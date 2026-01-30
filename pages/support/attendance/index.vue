<template>
  <div>
    <Heading size="xl" class="mb-6">Take Attendance</Heading>

    <div class="mb-6 flex gap-4 items-center flex-wrap">
      <input
        v-model="selectedDate"
        type="date"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchAttendance"
      />
      <button
        v-if="bulkMode"
        @click="exitBulkMode"
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        Exit Bulk Mode
      </button>
      <button
        v-else
        @click="enterBulkMode"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Bulk Mode
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="children.length === 0" class="p-8 text-center text-gray-500">
        No active children found.
      </div>

      <div v-else>
        <AttendanceBulkActions
          v-if="bulkMode"
          :select-all="selectedChildren.length === children.length"
          :selected-count="selectedChildren.length"
          @toggle-select-all="toggleSelectAll"
          @mark-all-present="markAllPresent"
          @clear-selection="clearSelection"
        />

        <div class="divide-y divide-gray-200">
          <div
            v-for="child in children"
            :key="child.id"
            class="p-4 flex items-center justify-between"
          >
            <div class="flex items-center gap-3 flex-1">
              <input
                v-if="bulkMode"
                type="checkbox"
                :checked="selectedChildren.includes(child.id)"
                @change="toggleChildSelection(child.id)"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900">
                  {{ child.first_name }} {{ child.last_name }}
                </p>
                <p v-if="getGroupName(child.group_id)" class="text-xs text-gray-500 mt-1">
                  Group: {{ getGroupName(child.group_id) }}
                </p>
                <p v-if="getCheckInTime(child.id)" class="text-xs text-blue-600 mt-1">
                  Check-in: {{ formatTime(getCheckInTime(child.id)) }}
                </p>
                <p v-if="getCheckOutTime(child.id)" class="text-xs text-orange-600 mt-1">
                  Check-out: {{ formatTime(getCheckOutTime(child.id)) }}
                </p>
              </div>
            </div>
            <div v-if="!bulkMode" class="flex gap-2">
              <CheckInOutButton
                :child-id="child.id"
                :date="selectedDate"
                :check-in-time="getCheckInTime(child.id)"
                :check-out-time="getCheckOutTime(child.id)"
                @check-in="handleCheckIn"
                @check-out="handleCheckOut"
              />
              <button
                @click="markPresent(child.id)"
                :class="[
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  getAttendanceStatus(child.id) === 'present'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]"
              >
                Present
              </button>
              <button
                @click="markAbsent(child.id)"
                :class="[
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  getAttendanceStatus(child.id) === 'absent'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]"
              >
                Absent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAttendanceStore } from '~/stores/attendance'
import { useChildrenStore } from '~/stores/children'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import AttendanceBulkActions from '~/components/attendance/AttendanceBulkActions.vue'
import CheckInOutButton from '~/components/attendance/CheckInOutButton.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'support'
})

const supabase = useSupabaseClient()
const attendanceStore = useAttendanceStore()
const childrenStore = useChildrenStore()
const groupsStore = useGroupsStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(true)
const error = ref('')
const children = ref<any[]>([])
const groups = ref<any[]>([])
const attendanceMap = ref<Record<string, any>>({})
const bulkMode = ref(false)
const selectedChildren = ref<string[]>([])

onMounted(async () => {
  await Promise.all([
    fetchChildren(),
    fetchGroups(),
    fetchAttendance()
  ])
})

const fetchChildren = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('children')
      .select('*')
      .eq('status', 'active')
      .order('first_name')

    if (fetchError) throw fetchError
    children.value = data || []
  } catch (e: any) {
    error.value = e.message
  }
}

const fetchGroups = async () => {
  try {
    await groupsStore.fetchGroups()
    groups.value = groupsStore.groups
  } catch (e: any) {
    console.error('Error fetching groups:', e)
  }
}

const fetchAttendance = async () => {
  try {
    loading.value = true
    await attendanceStore.fetchAttendance(undefined, selectedDate.value)
    
    attendanceMap.value = {}
    attendanceStore.attendance.forEach(a => {
      attendanceMap.value[a.child_id] = a
    })
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const getGroupName = (groupId: string) => {
  const group = groups.value.find(g => g.id === groupId)
  return group?.name || ''
}

const getAttendanceStatus = (childId: string) => {
  return attendanceMap.value[childId]?.status || ''
}

const getCheckInTime = (childId: string) => {
  return attendanceMap.value[childId]?.check_in_time
}

const getCheckOutTime = (childId: string) => {
  return attendanceMap.value[childId]?.check_out_time
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const enterBulkMode = () => {
  bulkMode.value = true
  selectedChildren.value = []
}

const exitBulkMode = () => {
  bulkMode.value = false
  selectedChildren.value = []
}

const toggleSelectAll = () => {
  if (selectedChildren.value.length === children.value.length) {
    selectedChildren.value = []
  } else {
    selectedChildren.value = children.value.map(c => c.id)
  }
}

const toggleChildSelection = (childId: string) => {
  const index = selectedChildren.value.indexOf(childId)
  if (index > -1) {
    selectedChildren.value.splice(index, 1)
  } else {
    selectedChildren.value.push(childId)
  }
}

const clearSelection = () => {
  selectedChildren.value = []
}

const markAllPresent = async () => {
  if (selectedChildren.value.length === 0) return

  try {
    await attendanceStore.markBulkAttendance(selectedChildren.value, selectedDate.value, 'present')
    alert(`Marked ${selectedChildren.value.length} children as present!`)
    await fetchAttendance()
    selectedChildren.value = []
  } catch (e: any) {
    alert(e.message || 'Failed to mark attendance')
  }
}

const markPresent = async (childId: string) => {
  try {
    await attendanceStore.markAttendance({
      child_id: childId,
      date: selectedDate.value,
      status: 'present',
      check_in_time: new Date().toISOString()
    })
    await fetchAttendance()
  } catch (e: any) {
    alert(e.message || 'Failed to mark attendance')
  }
}

const markAbsent = async (childId: string) => {
  try {
    await attendanceStore.markAttendance({
      child_id: childId,
      date: selectedDate.value,
      status: 'absent'
    })
    await fetchAttendance()
  } catch (e: any) {
    alert(e.message || 'Failed to mark attendance')
  }
}

const handleCheckIn = async (childId: string, date: string) => {
  try {
    await attendanceStore.checkIn(childId, date)
    await fetchAttendance()
  } catch (e: any) {
    alert(e.message || 'Failed to check in')
  }
}

const handleCheckOut = async (childId: string, date: string) => {
  try {
    await attendanceStore.checkOut(childId, date)
    await fetchAttendance()
  } catch (e: any) {
    alert(e.message || 'Failed to check out')
  }
}
</script>
