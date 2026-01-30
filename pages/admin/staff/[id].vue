<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/admin/staff"
        class="text-gray-600 hover:text-gray-900"
      >
        ← Back to Staff
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="staff" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="xl" class="mb-6">
          {{ staff.full_name }}
        </Heading>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-600">Email</label>
            <p class="mt-1 text-gray-900">{{ staff.email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Role</label>
            <span
              :class="[
                'inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full capitalize',
                staff.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                staff.role === 'kitchen' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              ]"
            >
              {{ staff.role }}
            </span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600">Phone</label>
            <p class="mt-1 text-gray-900">{{ staff.phone || '-' }}</p>
          </div>
        </div>
      </div>

      <div v-if="staff.role === 'teacher' || staff.role === 'support'" class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Assigned Groups</Heading>
        <div v-if="assignedGroups.length === 0" class="text-gray-500 text-sm">
          No groups assigned yet
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="group in assignedGroups"
            :key="group.id"
            class="p-3 bg-gray-50 rounded-md flex items-center justify-between"
          >
            <div>
              <div class="flex items-center gap-2 mb-1">
                <p class="font-medium">{{ group.name }}</p>
                <span
                  v-if="group.role"
                  :class="[
                    'px-2 py-0.5 text-xs font-medium rounded-full',
                    group.role === 'primary'
                      ? 'bg-blue-100 text-blue-800'
                      : group.role === 'assistant'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ group.role === 'primary' ? 'Primary' : group.role === 'assistant' ? 'Assistant' : 'Support' }}
                </span>
              </div>
              <p class="text-sm text-gray-600">{{ group.age_range }}</p>
              <p v-if="group.start_date" class="text-xs text-gray-500 mt-1">
                Since {{ formatDate(group.start_date) }}
              </p>
            </div>
            <NuxtLink
              :to="`/admin/groups/${group.id}`"
              class="text-blue-600 hover:text-blue-700 text-sm"
            >
              View →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useStaffStore } from '~/stores/staff'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const supabase = useSupabaseClient()
const staffStore = useStaffStore()
const groupsStore = useGroupsStore()

const staff = ref<any>(null)
const loading = ref(true)
const error = ref('')
const assignedGroups = ref<any[]>([])

const { groups } = storeToRefs(groupsStore)

onMounted(async () => {
  try {
    await Promise.all([
      staffStore.fetchStaff(),
      groupsStore.fetchGroups()
    ])

    const staffData = await staffStore.fetchStaffById(route.params.id as string)
    if (!staffData) {
      error.value = 'Staff member not found'
      return
    }
    staff.value = staffData

    // Get assigned groups for teachers using group_teachers table
    if (staffData.role === 'teacher' || staffData.role === 'support') {
      const { data: groupAssignments, error: assignError } = await supabase
        .from('group_teachers')
        .select('*, groups(*)')
        .eq('teacher_id', staffData.id)
        .is('end_date', null)

      if (assignError) {
        console.error('Error fetching group assignments:', assignError)
      } else if (groupAssignments) {
        assignedGroups.value = groupAssignments.map((assignment: any) => ({
          ...assignment.groups,
          role: assignment.role,
          start_date: assignment.start_date
        }))
      }
    } else {
      // Fallback to old educator_id system for backward compatibility
      const groupsArray = Array.isArray(groups.value) ? groups.value : []
      assignedGroups.value = groupsArray.filter(g => g.educator_id === staffData.id)
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load staff member'
  } finally {
    loading.value = false
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
