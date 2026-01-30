<template>
  <div>
    <Heading size="xl" class="mb-6">Leave Requests</Heading>

    <div class="mb-4 flex gap-4 border-b border-gray-200">
      <button
        @click="activeTab = 'children'"
        :class="[
          'px-4 py-2 font-medium transition-colors border-b-2',
          activeTab === 'children'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        ]"
      >
        Children Leave Requests
        <span v-if="childPendingCount > 0" class="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
          {{ childPendingCount }}
        </span>
      </button>
      <button
        @click="activeTab = 'teachers'"
        :class="[
          'px-4 py-2 font-medium transition-colors border-b-2',
          activeTab === 'teachers'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        ]"
      >
        Teacher Leave Requests
        <span v-if="teacherPendingCount > 0" class="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
          {{ teacherPendingCount }}
        </span>
      </button>
    </div>

    <div v-if="activeTab === 'children'" class="mb-4 flex gap-4">
      <button
        @click="childFilterStatus = 'pending'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          childFilterStatus === 'pending'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Pending ({{ childPendingCount }})
      </button>
      <button
        @click="childFilterStatus = 'all'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          childFilterStatus === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        All Requests
      </button>
    </div>

    <div v-if="activeTab === 'teachers'" class="mb-4 flex gap-4">
      <button
        @click="teacherFilterStatus = 'pending'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          teacherFilterStatus === 'pending'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Pending ({{ teacherPendingCount }})
      </button>
      <button
        @click="teacherFilterStatus = 'all'"
        :class="[
          'px-4 py-2 rounded-md transition-colors',
          teacherFilterStatus === 'all'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        All Requests
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Children Leave Requests -->
      <div v-if="activeTab === 'children'">
        <div v-if="filteredChildRequests.length === 0" class="p-8 text-center text-gray-500">
          No child leave requests found.
        </div>

        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="request in filteredChildRequests" :key="request.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ getChildName(request.child_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ getParentName(request.parent_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ request.leave_type }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div class="max-w-xs truncate" :title="request.reason">
                  {{ request.reason }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
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
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <NuxtLink
                  :to="`/admin/leave/${request.id}`"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Review
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Teacher Leave Requests -->
      <div v-if="activeTab === 'teachers'">
        <div v-if="filteredTeacherRequests.length === 0" class="p-8 text-center text-gray-500">
          No teacher leave requests found.
        </div>

        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="request in filteredTeacherRequests" :key="request.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ getTeacherName(request.teacher_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatLeaveType(request.leave_type) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <div class="max-w-xs truncate" :title="request.reason">
                  {{ request.reason }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
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
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <NuxtLink
                  :to="`/admin/leave/teachers/${request.id}`"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Review
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useLeaveRequestsStore } from '~/stores/leaveRequests'
import { useTeacherLeaveRequestsStore } from '~/stores/teacherLeaveRequests'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const leaveRequestsStore = useLeaveRequestsStore()
const teacherLeaveRequestsStore = useTeacherLeaveRequestsStore()
const childrenStore = useChildrenStore()

const loading = ref(true)
const error = ref('')
const activeTab = ref<'children' | 'teachers'>('children')
const childFilterStatus = ref<'pending' | 'all'>('pending')
const teacherFilterStatus = ref<'pending' | 'all'>('pending')
const teachers = ref<any[]>([])

const { leaveRequests } = storeToRefs(leaveRequestsStore)
const { leaveRequests: teacherLeaveRequests } = storeToRefs(teacherLeaveRequestsStore)

const filteredChildRequests = computed(() => {
  if (childFilterStatus.value === 'pending') {
    return leaveRequests.value.filter(r => r.status === 'pending')
  }
  return leaveRequests.value
})

const filteredTeacherRequests = computed(() => {
  if (teacherFilterStatus.value === 'pending') {
    return teacherLeaveRequests.value.filter(r => r.status === 'pending')
  }
  return teacherLeaveRequests.value
})

const childPendingCount = computed(() => {
  return leaveRequests.value.filter(r => r.status === 'pending').length
})

const teacherPendingCount = computed(() => {
  return teacherLeaveRequests.value.filter(r => r.status === 'pending').length
})

onMounted(async () => {
  try {
    await Promise.all([
      leaveRequestsStore.fetchLeaveRequests(),
      teacherLeaveRequestsStore.fetchLeaveRequests(),
      childrenStore.fetchChildren(),
      fetchTeachers()
    ])
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

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

const getChildName = (childId: string) => {
  const child = childrenStore.children.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const getParentName = (parentId: string) => {
  // This would ideally be fetched and cached, but for now we'll use a simple approach
  // For now, return the ID - can be enhanced with a profiles cache
  return parentId
}

const getTeacherName = (teacherId: string) => {
  const teacher = teachers.value.find(t => t.id === teacherId)
  return teacher?.full_name || teacherId
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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
