<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Attendance</Heading>
      <NuxtLink
        to="/parent/leave/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        📝 Request Leave
      </NuxtLink>
    </div>

    <div class="mb-4">
      <input
        v-model="selectedDate"
        type="date"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchAttendance"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="attendance.length === 0" class="p-8 text-center text-gray-500">
        No attendance records for this date.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="record in attendance"
          :key="record.id"
          class="p-6"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">
                {{ getChildName(record.child_id) }}
              </p>
              <p class="text-sm text-gray-600 mt-1">
                Check In: {{ record.check_in_time ? formatTime(record.check_in_time) : 'Not checked in' }}
              </p>
              <p class="text-sm text-gray-600">
                Check Out: {{ record.check_out_time ? formatTime(record.check_out_time) : 'Not checked out' }}
              </p>
              <p v-if="record.notes" class="text-xs text-gray-500 mt-1">
                Note: {{ record.notes }}
              </p>
            </div>
            <span
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                record.status === 'present' ? 'bg-green-100 text-green-800' :
                record.status === 'absent' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              ]"
            >
              {{ record.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useAttendanceStore } from '~/stores/attendance'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()
const { attendance, loading, error } = storeToRefs(attendanceStore)

const selectedDate = ref(new Date().toISOString().split('T')[0])
const myChildren = ref<any[]>([])

onMounted(async () => {
  await fetchMyChildren()
  await attendanceStore.fetchAttendance(undefined, selectedDate.value)
})

const fetchMyChildren = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    const { data: children } = await supabase
      .from('children')
      .select('*')
      .contains('parent_ids', [userId])

    myChildren.value = children || []
    
    // Filter attendance to only my children
    if (myChildren.value.length > 0) {
      const childIds = myChildren.value.map(c => c.id)
      attendanceStore.attendance = attendanceStore.attendance.filter(a => childIds.includes(a.child_id))
    }
  } catch (e: any) {
    console.error('Error fetching children:', e)
  }
}

const fetchAttendance = async () => {
  await attendanceStore.fetchAttendance(undefined, selectedDate.value)
  // Filter to my children again
  if (myChildren.value.length > 0) {
    const childIds = myChildren.value.map(c => c.id)
    attendanceStore.attendance = attendanceStore.attendance.filter(a => childIds.includes(a.child_id))
  }
}

const getChildName = (childId: string) => {
  const child = myChildren.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString()
}
</script>
