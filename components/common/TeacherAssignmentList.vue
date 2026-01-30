<template>
  <div class="space-y-3">
    <div v-if="loading" class="text-center py-4 text-gray-500 text-sm">
      Loading assignments...
    </div>

    <div v-else-if="assignments.length === 0" class="text-center py-4 text-gray-500 text-sm">
      No staff assignments yet.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="assignment in assignments"
        :key="`${assignment.id}-${refreshKey}`"
        class="p-3 bg-gray-50 rounded-md border border-gray-200"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-gray-900">{{ getStaffName(assignment.staff_id) }}</p>
              <span
                :class="[
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  assignment.assignment_type === 'primary_teacher'
                    ? 'bg-blue-100 text-blue-800'
                    : assignment.assignment_type === 'assistant_teacher'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ formatAssignmentType(assignment.assignment_type) }}
              </span>
            </div>
            <p class="text-sm text-gray-600">
              {{ formatDate(assignment.start_date) }}
              <span v-if="assignment.end_date">
                - {{ formatDate(assignment.end_date) }}
              </span>
              <span v-else class="text-green-600"> (Active)</span>
            </p>
            <p v-if="assignment.notes" class="text-xs text-gray-500 mt-1">
              {{ assignment.notes }}
            </p>
          </div>
          <button
            v-if="canEdit"
            @click="$emit('edit', assignment)"
            class="ml-2 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Edit
          </button>
          <button
            v-if="canDelete"
            @click="$emit('delete', assignment)"
            class="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import { useStaffAssignmentsStore } from '~/stores/staffAssignments'
import type { StaffAssignment } from '~/stores/staffAssignments'

interface Props {
  childId?: string
  staffId?: string
  canEdit?: boolean
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  childId: undefined,
  staffId: undefined,
  canEdit: false,
  canDelete: false
})

const emit = defineEmits<{
  (e: 'edit', assignment: StaffAssignment): void
  (e: 'delete', assignment: StaffAssignment): void
  (e: 'refreshed'): void
}>()

const supabase = useSupabaseClient()
const staffAssignmentsStore = useStaffAssignmentsStore()

const assignments = ref<StaffAssignment[]>([])
const loading = ref(true)
const staffNames = ref<Record<string, string>>({})
const refreshKey = ref(0)

// Define fetchAssignments before using it in watchers
const fetchAssignments = async () => {
  loading.value = true
  try {
    await staffAssignmentsStore.fetchAssignments(props.childId, props.staffId)
    assignments.value = [...staffAssignmentsStore.assignments] // Create new array reference
    refreshKey.value++ // Force re-render

    // Fetch staff names
    const staffIds = [...new Set(assignments.value.map(a => a.staff_id))]
    if (staffIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', staffIds)

      if (data) {
        staffNames.value = {}
        data.forEach(profile => {
          staffNames.value[profile.id] = profile.full_name
        })
      }
    }
    
    emit('refreshed')
  } catch (e: any) {
    console.error('Error fetching assignments:', e)
  } finally {
    loading.value = false
  }
}

// Expose refresh method for parent components
defineExpose({
  refresh: fetchAssignments
})

onMounted(async () => {
  await fetchAssignments()
})

watch(() => [props.childId, props.staffId], () => {
  if (props.childId || props.staffId) {
    fetchAssignments()
  }
})

const getStaffName = (staffId: string) => {
  return staffNames.value[staffId] || staffId
}

const formatAssignmentType = (type: string) => {
  const types: Record<string, string> = {
    primary_teacher: 'Primary Teacher',
    assistant_teacher: 'Assistant Teacher',
    support_staff: 'Support Staff'
  }
  return types[type] || type
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
