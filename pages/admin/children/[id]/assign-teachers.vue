<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        :to="`/admin/children/${childId}`"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Child Details
      </NuxtLink>
      <Heading size="xl">Assign Teachers to Child</Heading>
      <p class="text-sm text-gray-500 mt-2">Route: {{ $route.path }}</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Current Assignments</Heading>
        <TeacherAssignmentList
          ref="assignmentListRef"
          :child-id="childId"
          :can-edit="true"
          :can-delete="true"
          @edit="handleEdit"
          @delete="handleDelete"
          :key="listKey"
        />
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Add New Assignment</Heading>
        <TeacherAssignmentForm
          :key="formKey"
          :child-id="childId"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>

      <div v-if="editingAssignment" class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Edit Assignment</Heading>
        <TeacherAssignmentForm
          :child-id="childId"
          :initial-data="editingAssignment"
          @submit="handleUpdate"
          @cancel="cancelEdit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStaffAssignmentsStore } from '~/stores/staffAssignments'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import TeacherAssignmentForm from '~/components/forms/TeacherAssignmentForm.vue'
import TeacherAssignmentList from '~/components/common/TeacherAssignmentList.vue'
import type { StaffAssignment } from '~/stores/staffAssignments'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const staffAssignmentsStore = useStaffAssignmentsStore()
const childrenStore = useChildrenStore()

const childId = route.params.id as string
const loading = ref(true)
const error = ref('')
const editingAssignment = ref<StaffAssignment | null>(null)
const formKey = ref(0)
const listKey = ref(0)
const assignmentListRef = ref<InstanceType<typeof TeacherAssignmentList> | null>(null)

onMounted(async () => {
  console.log('Assign Teachers page mounted!', { childId, route: route.path })
  try {
    const child = await childrenStore.fetchChildById(childId)
    if (!child) {
      error.value = 'Child not found'
      return
    }
    console.log('Child loaded successfully:', child.first_name, child.last_name)
  } catch (e: any) {
    console.error('Error loading child:', e)
    error.value = e.message || 'Failed to load child'
  } finally {
    loading.value = false
  }
})

const handleSubmit = async (data: any) => {
  console.log('handleSubmit called with data:', data)
  
  if (!data.child_id) {
    alert('Error: Child ID is missing')
    return
  }

  if (!data.staff_id) {
    alert('Error: Staff ID is missing')
    return
  }

  if (!data.assignment_type) {
    alert('Error: Assignment type is missing')
    return
  }

  if (!data.start_date) {
    alert('Error: Start date is missing')
    return
  }

  try {
    console.log('Creating assignment...')
    const result = await staffAssignmentsStore.createAssignment(data)
    console.log('Assignment created:', result)
    
    // Refresh assignments list
    await staffAssignmentsStore.fetchAssignments(childId)
    listKey.value++
    assignmentListRef.value?.refresh()
    
    // Reset form by incrementing key
    formKey.value++
    
    alert('Assignment created successfully!')
  } catch (e: any) {
    console.error('Error creating assignment:', e)
    let errorMessage = e.message || e.error?.message || 'Failed to create assignment'
    
    // Provide more helpful error messages
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      errorMessage = 'Database table not found. Please run the migration: supabase/migrations/add-staff-assignments.sql'
    } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
      errorMessage = 'Permission denied. Please check RLS policies in Supabase.'
    } else if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      errorMessage = 'This staff member is already assigned to this child with the same assignment type.'
    } else if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
      errorMessage = 'Invalid staff member or child. Please refresh the page and try again.'
    }
    
    alert(errorMessage)
  }
}

const handleUpdate = async (data: any) => {
  if (!editingAssignment.value) return

  try {
    await staffAssignmentsStore.updateAssignment(editingAssignment.value.id, data)
    // Refresh assignments list
    await staffAssignmentsStore.fetchAssignments(childId)
    listKey.value++
    assignmentListRef.value?.refresh()
    alert('Assignment updated successfully!')
    editingAssignment.value = null
  } catch (e: any) {
    console.error('Error updating assignment:', e)
    const errorMessage = e.message || e.error?.message || 'Failed to update assignment'
    alert(errorMessage)
  }
}

const handleEdit = (assignment: StaffAssignment) => {
  editingAssignment.value = assignment
}

const cancelEdit = () => {
  editingAssignment.value = null
}

const handleDelete = async (assignment: StaffAssignment) => {
  if (!confirm('Are you sure you want to remove this assignment?')) return

  try {
    await staffAssignmentsStore.deleteAssignment(assignment.id)
    // Refresh assignments list
    await staffAssignmentsStore.fetchAssignments(childId)
    listKey.value++
    assignmentListRef.value?.refresh()
    alert('Assignment removed successfully!')
  } catch (e: any) {
    console.error('Error deleting assignment:', e)
    const errorMessage = e.message || e.error?.message || 'Failed to remove assignment'
    alert(errorMessage)
  }
}

const handleCancel = () => {
  router.push(`/admin/children/${childId}`)
}
</script>
