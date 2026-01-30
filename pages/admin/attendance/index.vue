<template>
  <div>
    <Heading size="xl" class="mb-6">Attendance</Heading>

    <div class="mb-4">
      <input
        v-model="selectedDate"
        type="date"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Child
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Check In
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Check Out
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="record in attendance" :key="record.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ getChildName(record.child_id) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ record.check_in_time ? formatTime(record.check_in_time) : '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ record.check_out_time ? formatTime(record.check_out_time) : '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
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
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '~/stores/attendance'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const attendanceStore = useAttendanceStore()
const childrenStore = useChildrenStore()
const { attendance, loading, error } = storeToRefs(attendanceStore)

const selectedDate = ref(new Date().toISOString().split('T')[0])

onMounted(async () => {
  await childrenStore.fetchChildren()
  await attendanceStore.fetchAttendance(undefined, selectedDate.value)
})

const fetchAttendance = async () => {
  await attendanceStore.fetchAttendance(undefined, selectedDate.value)
}

const getChildName = (childId: string) => {
  const child = childrenStore.children.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString()
}
</script>
