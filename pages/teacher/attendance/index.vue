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
      <div v-if="myChildren.length === 0" class="p-8 text-center text-gray-500">
        No children in your groups.
      </div>

      <div v-else>
        <AttendanceBulkActions
          v-if="bulkMode"
          :select-all="selectedChildren.length === myChildren.length && myChildren.length > 0"
          :selected-count="selectedChildren.length"
          @toggle-select-all="toggleSelectAll"
          @mark-all-present="markAllPresent"
          @clear-selection="clearSelection"
        />

        <div class="divide-y divide-gray-200">
          <div
            v-for="child in myChildren"
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
                <p v-if="getAbsenceSubmission(child.id)" class="text-xs text-gray-500 mt-1">
                  Reason: {{ getAbsenceSubmission(child.id)?.reason }}
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
                @click="openAbsenceModal(child.id)"
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

    <!-- Absence Submission Modal -->
    <div
      v-if="showAbsenceModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeAbsenceModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <AbsenceSubmissionForm
          @submit="handleAbsenceSubmit"
          @cancel="closeAbsenceModal"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useAttendanceStore } from '~/stores/attendance'
import { useGroupTeachersStore } from '~/stores/groupTeachers'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import AbsenceSubmissionForm from '~/components/forms/AbsenceSubmissionForm.vue'
import AttendanceBulkActions from '~/components/attendance/AttendanceBulkActions.vue'
import CheckInOutButton from '~/components/attendance/CheckInOutButton.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()
const groupTeachersStore = useGroupTeachersStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(true)
const error = ref('')
const myChildren = ref<any[]>([])
const attendanceMap = ref<Record<string, any>>({})
const absenceSubmissionsMap = ref<Record<string, any>>({})
const showAbsenceModal = ref(false)
const selectedChildId = ref<string | null>(null)
const bulkMode = ref(false)
const selectedChildren = ref<string[]>([])

onMounted(async () => {
  await fetchChildren()
  await fetchAttendance()
})

const fetchChildren = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // Use group_teachers table to find teacher's assigned groups
    const { data: groupAssignments, error: groupsError } = await supabase
      .from('group_teachers')
      .select('group_id')
      .eq('teacher_id', userId)
      .is('end_date', null) // Only active assignments

    if (groupsError) {
      console.error('Error fetching group assignments:', groupsError)
      // Fallback to old method for backward compatibility
      const { data: groups } = await supabase
        .from('groups')
        .select('id')
        .eq('educator_id', userId)

      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id)
        const { data: children } = await supabase
          .from('children')
          .select('*')
          .in('group_id', groupIds)
          .order('first_name')

        myChildren.value = children || []
      }
      return
    }

    if (groupAssignments && groupAssignments.length > 0) {
      const groupIds = groupAssignments.map(ga => ga.group_id)
      const { data: children } = await supabase
        .from('children')
        .select('*')
        .in('group_id', groupIds)
        .eq('status', 'active')
        .order('first_name')

      myChildren.value = children || []
    } else {
      // No groups assigned via group_teachers, check old method
      const { data: groups } = await supabase
        .from('groups')
        .select('id')
        .eq('educator_id', userId)

      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id)
        const { data: children } = await supabase
          .from('children')
          .select('*')
          .in('group_id', groupIds)
          .order('first_name')

        myChildren.value = children || []
      }
    }
  } catch (e: any) {
    console.error('Error fetching children:', e)
    error.value = e.message
  }
}

const fetchAttendance = async () => {
  try {
    loading.value = true
    await attendanceStore.fetchAttendance(undefined, selectedDate.value)
    
    // Build attendance map with full attendance data
    attendanceMap.value = {}
    attendanceStore.attendance.forEach(a => {
      attendanceMap.value[a.child_id] = a
    })

    // Fetch absence submissions for today's attendance
    for (const attendance of attendanceStore.attendance) {
      if (attendance.absence_submission_id) {
        await attendanceStore.fetchAbsenceSubmissions(attendance.id)
        const submission = attendanceStore.absenceSubmissions.find(
          s => s.attendance_id === attendance.id
        )
        if (submission) {
          absenceSubmissionsMap.value[attendance.child_id] = submission
        }
      }
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
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
  console.log('toggleSelectAll called', {
    selectedCount: selectedChildren.value.length,
    totalCount: myChildren.value.length,
    selected: selectedChildren.value,
    allIds: myChildren.value.map(c => c.id)
  })
  
  if (selectedChildren.value.length === myChildren.value.length && myChildren.value.length > 0) {
    // Deselect all
    selectedChildren.value = []
  } else {
    // Select all
    selectedChildren.value = [...myChildren.value.map(c => c.id)]
  }
  
  console.log('After toggle:', {
    selectedCount: selectedChildren.value.length,
    selected: selectedChildren.value
  })
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

const markPresent = async (childId: string) => {
  try {
    await attendanceStore.markAttendance({
      child_id: childId,
      date: selectedDate.value,
      status: 'present',
      check_in_time: new Date().toISOString()
    })
    await fetchAttendance() // Refresh attendance data
  } catch (e: any) {
    alert(e.message || 'Failed to mark attendance')
  }
}

const openAbsenceModal = (childId: string) => {
  selectedChildId.value = childId
  showAbsenceModal.value = true
}

const closeAbsenceModal = () => {
  showAbsenceModal.value = false
  selectedChildId.value = null
}

const handleAbsenceSubmit = async (data: { reason: string; notes?: string }) => {
  if (!selectedChildId.value) return

  try {
    await attendanceStore.markAbsentWithSubmission(
      selectedChildId.value,
      selectedDate.value,
      data.reason,
      data.notes
    )
    
    attendanceMap.value[selectedChildId.value] = 'absent'
    
    // Refresh to get the absence submission
    await fetchAttendance()
    
    closeAbsenceModal()
  } catch (e: any) {
    alert(e.message || 'Failed to mark absence')
  }
}

const getAbsenceSubmission = (childId: string) => {
  return absenceSubmissionsMap.value[childId]
}
</script>
