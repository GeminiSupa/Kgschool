<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">My Leave Requests</Heading>
      <NuxtLink
        to="/teacher/leave/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ New Request
      </NuxtLink>
    </div>

    <div class="mb-4 flex gap-4">
      <button
        @click="filterStatus = 'all'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          filterStatus === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        All
      </button>
      <button
        @click="filterStatus = 'pending'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          filterStatus === 'pending'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Pending
      </button>
      <button
        @click="filterStatus = 'approved'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          filterStatus === 'approved'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Approved
      </button>
      <button
        @click="filterStatus = 'rejected'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          filterStatus === 'rejected'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Rejected
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="filteredRequests.length === 0" class="p-8 text-center text-gray-500">
        No leave requests found.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="request in filteredRequests"
          :key="request.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ request.status }}
                </span>
                <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {{ formatLeaveType(request.leave_type) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-1">
                {{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }}
              </p>
              <p class="text-gray-900 mb-2">{{ request.reason }}</p>
              <p v-if="request.admin_notes" class="text-sm text-gray-600 mt-2">
                <strong>Admin Notes:</strong> {{ request.admin_notes }}
              </p>
              <p v-if="request.reviewed_at" class="text-xs text-gray-500 mt-2">
                Reviewed on {{ formatDateTime(request.reviewed_at) }}
              </p>
            </div>
            <button
              v-if="request.status === 'pending'"
              @click="deleteRequest(request.id)"
              class="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTeacherLeaveRequestsStore } from '~/stores/teacherLeaveRequests'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const teacherLeaveRequestsStore = useTeacherLeaveRequestsStore()
const authStore = useAuthStore()
const { leaveRequests, loading, error } = storeToRefs(teacherLeaveRequestsStore)

const filterStatus = ref<'all' | 'pending' | 'approved' | 'rejected'>('all')

const filteredRequests = computed(() => {
  if (filterStatus.value === 'all') {
    return leaveRequests.value
  }
  return leaveRequests.value.filter(r => r.status === filterStatus.value)
})

onMounted(async () => {
  if (authStore.user?.id) {
    await teacherLeaveRequestsStore.fetchLeaveRequests(authStore.user.id)
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

const formatLeaveType = (type: string) => {
  const types: Record<string, string> = {
    vacation: 'Vacation',
    sick: 'Sick Leave',
    personal: 'Personal',
    other: 'Other'
  }
  return types[type] || type
}

const deleteRequest = async (id: string) => {
  if (!confirm('Are you sure you want to cancel this leave request?')) return

  try {
    await teacherLeaveRequestsStore.deleteLeaveRequest(id)
    if (authStore.user?.id) {
      await teacherLeaveRequestsStore.fetchLeaveRequests(authStore.user.id)
    }
  } catch (error: any) {
    alert(error.message || 'Failed to cancel request')
  }
}
</script>
