<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Leave Requests</Heading>
      <NuxtLink
        to="/parent/leave/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ New Request
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="leaveRequests.length === 0" class="p-8 text-center text-gray-500">
        No leave requests yet.
        <NuxtLink
          to="/parent/leave/new"
          class="text-blue-600 hover:text-blue-700 underline ml-1"
        >
          Create one now
        </NuxtLink>
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="request in leaveRequests"
          :key="request.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <p class="font-medium text-gray-900">
                  {{ getChildName(request.child_id) }}
                </p>
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
              </div>
              
              <div class="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Dates:</strong> {{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }}
                </p>
                <p>
                  <strong>Type:</strong> {{ request.leave_type }}
                </p>
                <p>
                  <strong>Reason:</strong> {{ request.reason }}
                </p>
                <p v-if="request.notes">
                  <strong>Notes:</strong> {{ request.notes }}
                </p>
                <p v-if="request.admin_notes" class="mt-2 text-gray-500 italic">
                  <strong>Admin Response:</strong> {{ request.admin_notes }}
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Submitted: {{ formatDateTime(request.created_at) }}
                </p>
                <p v-if="request.reviewed_at" class="text-xs text-gray-500">
                  Reviewed: {{ formatDateTime(request.reviewed_at) }}
                </p>
              </div>
            </div>
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
import { useLeaveRequestsStore } from '~/stores/leaveRequests'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const leaveRequestsStore = useLeaveRequestsStore()

const loading = ref(true)
const error = ref('')
const myChildren = ref<any[]>([])
const { leaveRequests } = storeToRefs(leaveRequestsStore)

onMounted(async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // Fetch my children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .contains('parent_ids', [userId])

    myChildren.value = children || []

    // Fetch leave requests for my children
    if (myChildren.value.length > 0) {
      const childIds = myChildren.value.map(c => c.id)
      await Promise.all(
        childIds.map(childId => leaveRequestsStore.fetchLeaveRequests(childId))
      )
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const getChildName = (childId: string) => {
  const child = myChildren.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}
</script>
