<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="staff_id" class="block text-sm font-medium text-gray-700 mb-2">
        Staff Member <span class="text-red-500">*</span>
      </label>
      <select
        id="staff_id"
        v-model="form.staff_id"
        required
        :disabled="staffLoading"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{{ staffLoading ? 'Loading staff...' : 'Select staff member' }}</option>
        <option v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
          {{ staff.full_name }} ({{ staff.role }})
        </option>
      </select>
    </div>

    <div>
      <label for="assignment_type" class="block text-sm font-medium text-gray-700 mb-2">
        Assignment Type <span class="text-red-500">*</span>
      </label>
      <select
        id="assignment_type"
        v-model="form.assignment_type"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="primary_teacher">Primary Teacher</option>
        <option value="assistant_teacher">Assistant Teacher</option>
        <option value="support_staff">Support Staff</option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="start_date" class="block text-sm font-medium text-gray-700 mb-2">
          Start Date <span class="text-red-500">*</span>
        </label>
        <input
          id="start_date"
          v-model="form.start_date"
          type="date"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="end_date" class="block text-sm font-medium text-gray-700 mb-2">
          End Date (Optional)
        </label>
        <input
          id="end_date"
          v-model="form.end_date"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div>
      <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
        Notes
      </label>
      <textarea
        id="notes"
        v-model="form.notes"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Additional notes about this assignment..."
      />
    </div>

    <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
      {{ error }}
    </div>

    <div class="flex gap-3 justify-end pt-4">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Saving...' : 'Save Assignment' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useStaffAssignmentsStore } from '~/stores/staffAssignments'

interface Props {
  childId?: string
  groupId?: string
  initialData?: any
}

const props = withDefaults(defineProps<Props>(), {
  childId: undefined,
  groupId: undefined,
  initialData: undefined
})

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const supabase = useSupabaseClient()
const staffAssignmentsStore = useStaffAssignmentsStore()

const staffMembers = ref<any[]>([])
const staffLoading = ref(true)
const loading = ref(false)
const error = ref('')

const form = ref({
  staff_id: props.initialData?.staff_id || '',
  assignment_type: props.initialData?.assignment_type || 'primary_teacher',
  start_date: props.initialData?.start_date || new Date().toISOString().split('T')[0],
  end_date: props.initialData?.end_date || '',
  notes: props.initialData?.notes || ''
})

onMounted(async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['teacher', 'support'])
      .order('full_name')

    if (fetchError) throw fetchError
    staffMembers.value = data || []
  } catch (e: any) {
    error.value = e.message || 'Failed to load staff members'
  } finally {
    staffLoading.value = false
  }
})

const handleSubmit = async () => {
  // Validate form
  error.value = ''
  
  if (!form.value.staff_id) {
    error.value = 'Please select a staff member'
    return
  }

  if (!form.value.assignment_type) {
    error.value = 'Please select an assignment type'
    return
  }

  if (!form.value.start_date) {
    error.value = 'Please select a start date'
    return
  }

  // Validate date range
  if (form.value.end_date && form.value.end_date.trim() !== '') {
    const startDate = new Date(form.value.start_date)
    const endDate = new Date(form.value.end_date)
    
    if (endDate < startDate) {
      error.value = 'End date must be after start date'
      return
    }
  }

  // Validate start date is not in the past (allow today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(form.value.start_date)
  if (startDate < today) {
    error.value = 'Start date cannot be in the past'
    return
  }

  if (!props.childId) {
    error.value = 'Child ID is missing'
    return
  }

  loading.value = true

  try {
    const assignmentData: any = {
      staff_id: form.value.staff_id,
      assignment_type: form.value.assignment_type,
      start_date: form.value.start_date,
      child_id: props.childId
    }

    if (form.value.end_date && form.value.end_date.trim() !== '') {
      assignmentData.end_date = form.value.end_date
    }

    if (form.value.notes && form.value.notes.trim() !== '') {
      assignmentData.notes = form.value.notes.trim()
    }

    console.log('Submitting assignment:', assignmentData)
    emit('submit', assignmentData)
    
    // Reset form after successful emit (parent will handle the actual submission)
    // The parent will reset the form component via key change
  } catch (e: any) {
    error.value = e.message || 'Failed to submit assignment'
    console.error('Error in handleSubmit:', e)
    loading.value = false
  }
}
</script>
