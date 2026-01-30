<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/leave"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Leave Requests
      </NuxtLink>
      <Heading size="xl">Review Leave Request</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="!request" class="p-8 text-center text-gray-500">
      Leave request not found.
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <div class="space-y-6">
        <div>
          <h3 class="text-sm font-medium text-gray-500">Child</h3>
          <p class="mt-1 text-lg text-gray-900">{{ getChildName(request.child_id) }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Parent</h3>
          <p class="mt-1 text-lg text-gray-900">{{ parentName }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Start Date</h3>
            <p class="mt-1 text-gray-900">{{ formatDate(request.start_date) }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">End Date</h3>
            <p class="mt-1 text-gray-900">{{ formatDate(request.end_date) }}</p>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Leave Type</h3>
          <p class="mt-1 text-gray-900 capitalize">{{ request.leave_type }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Reason</h3>
          <p class="mt-1 text-gray-900">{{ request.reason }}</p>
        </div>

        <div v-if="request.notes">
          <h3 class="text-sm font-medium text-gray-500">Additional Notes</h3>
          <p class="mt-1 text-gray-900">{{ request.notes }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Status</h3>
          <span
            :class="[
              'mt-1 inline-block px-3 py-1 text-sm font-medium rounded-full',
              request.status === 'approved' ? 'bg-green-100 text-green-800' :
              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            ]"
          >
            {{ request.status }}
          </span>
        </div>

        <div v-if="request.admin_notes">
          <h3 class="text-sm font-medium text-gray-500">Admin Notes</h3>
          <p class="mt-1 text-gray-900">{{ request.admin_notes }}</p>
        </div>

        <div v-if="request.status === 'pending'" class="border-t pt-6">
          <h3 class="text-sm font-medium text-gray-700 mb-4">Admin Response</h3>
          
          <div class="mb-4">
            <label for="admin_notes" class="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="admin_notes"
              v-model="adminNotes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes for the parent..."
            />
          </div>

          <div class="flex gap-3">
            <button
              @click="approveRequest"
              :disabled="processing"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ processing ? 'Processing...' : 'Approve' }}
            </button>
            <button
              @click="rejectRequest"
              :disabled="processing"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ processing ? 'Processing...' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useLeaveRequestsStore } from '~/stores/leaveRequests'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const leaveRequestsStore = useLeaveRequestsStore()
const childrenStore = useChildrenStore()

const loading = ref(true)
const error = ref('')
const request = ref<any>(null)
const parentName = ref('')
const adminNotes = ref('')
const processing = ref(false)

onMounted(async () => {
  try {
    const requestId = route.params.id as string
    
    // Fetch leave requests
    await leaveRequestsStore.fetchLeaveRequests()
    request.value = leaveRequestsStore.leaveRequests.find(r => r.id === requestId)

    if (request.value) {
      // Fetch parent name
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', request.value.parent_id)
        .single()
      parentName.value = data?.full_name || request.value.parent_id

      // Fetch children for name lookup
      await childrenStore.fetchChildren()
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const approveRequest = async () => {
  if (!request.value) return

  processing.value = true
  try {
    await leaveRequestsStore.updateLeaveRequestStatus(
      request.value.id,
      'approved',
      adminNotes.value || undefined
    )
    alert('Leave request approved successfully!')
    router.push('/admin/leave')
  } catch (e: any) {
    alert(e.message || 'Failed to approve request')
  } finally {
    processing.value = false
  }
}

const rejectRequest = async () => {
  if (!request.value) return

  processing.value = true
  try {
    await leaveRequestsStore.updateLeaveRequestStatus(
      request.value.id,
      'rejected',
      adminNotes.value || undefined
    )
    alert('Leave request rejected.')
    router.push('/admin/leave')
  } catch (e: any) {
    alert(e.message || 'Failed to reject request')
  } finally {
    processing.value = false
  }
}

const getChildName = (childId: string) => {
  const child = childrenStore.children.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
