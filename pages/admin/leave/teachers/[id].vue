<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/leave"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Leave Requests
      </NuxtLink>
      <Heading size="xl">Review Teacher Leave Request</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="request" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Teacher</label>
            <p class="mt-1 text-gray-900">{{ getTeacherName(request.teacher_id) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Status</label>
            <span
              :class="[
                'inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full',
                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              ]"
            >
              {{ request.status }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Start Date</label>
            <p class="mt-1 text-gray-900">{{ formatDate(request.start_date) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">End Date</label>
            <p class="mt-1 text-gray-900">{{ formatDate(request.end_date) }}</p>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Leave Type</label>
          <p class="mt-1 text-gray-900">{{ formatLeaveType(request.leave_type) }}</p>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Reason</label>
          <p class="mt-1 text-gray-900">{{ request.reason }}</p>
        </div>

        <div v-if="request.admin_notes" class="mb-4">
          <label class="block text-sm font-medium text-gray-600">Admin Notes</label>
          <p class="mt-1 text-gray-900">{{ request.admin_notes }}</p>
        </div>

        <div v-if="request.status === 'pending'" class="pt-4 border-t space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
            <textarea
              v-model="adminNotes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this decision..."
            />
          </div>

          <div class="flex gap-3">
            <button
              @click="approveRequest"
              :disabled="processing"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Approve
            </button>
            <button
              @click="rejectRequest"
              :disabled="processing"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Reject
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
import { useTeacherLeaveRequestsStore } from '~/stores/teacherLeaveRequests'
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
const teacherLeaveRequestsStore = useTeacherLeaveRequestsStore()

const requestId = route.params.id as string
const loading = ref(true)
const error = ref('')
const request = ref<any>(null)
const teachers = ref<any[]>([])
const adminNotes = ref('')
const processing = ref(false)

onMounted(async () => {
  try {
    await Promise.all([
      fetchRequest(),
      fetchTeachers()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load request'
  } finally {
    loading.value = false
  }
})

const fetchRequest = async () => {
  try {
    await teacherLeaveRequestsStore.fetchLeaveRequests()
    const found = teacherLeaveRequestsStore.leaveRequests.find(r => r.id === requestId)
    if (!found) {
      error.value = 'Request not found'
      return
    }
    request.value = found
  } catch (e: any) {
    error.value = e.message || 'Failed to load request'
  }
}

const fetchTeachers = async () => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'teacher')
      .order('full_name')

    teachers.value = data || []
  } catch (e: any) {
    console.error('Error fetching teachers:', e)
  }
}

const getTeacherName = (teacherId: string) => {
  const teacher = teachers.value.find(t => t.id === teacherId)
  return teacher?.full_name || teacherId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
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

const approveRequest = async () => {
  if (!request.value) return

  processing.value = true
  try {
    await teacherLeaveRequestsStore.updateLeaveRequestStatus(
      request.value.id,
      'approved',
      adminNotes.value || undefined
    )
    alert('Leave request approved!')
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
    await teacherLeaveRequestsStore.updateLeaveRequestStatus(
      request.value.id,
      'rejected',
      adminNotes.value || undefined
    )
    alert('Leave request rejected!')
    router.push('/admin/leave')
  } catch (e: any) {
    alert(e.message || 'Failed to reject request')
  } finally {
    processing.value = false
  }
}
</script>
