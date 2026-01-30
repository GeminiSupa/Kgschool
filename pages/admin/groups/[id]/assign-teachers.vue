<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        :to="`/admin/groups/${groupId}`"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Group Details
      </NuxtLink>
      <Heading size="xl">Manage Group Teachers</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Current Teachers</Heading>
        <GroupTeacherList
          :group-id="groupId"
          :can-edit="true"
          :can-delete="true"
          @edit="handleEdit"
          @delete="handleDelete"
          @set-primary="handleSetPrimary"
          :key="listKey"
        />
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">
          {{ editingAssignment ? 'Edit Assignment' : 'Add New Teacher' }}
        </Heading>
        <GroupTeacherAssignmentForm
          :group-id="groupId"
          :initial-data="editingAssignment"
          :exclude-teacher-ids="currentTeacherIds"
          @submit="handleSubmit"
          @cancel="handleCancel"
          :key="formKey"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGroupsStore } from '~/stores/groups'
import { useGroupTeachersStore } from '~/stores/groupTeachers'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import GroupTeacherList from '~/components/groups/GroupTeacherList.vue'
import GroupTeacherAssignmentForm from '~/components/forms/GroupTeacherAssignmentForm.vue'
import type { GroupTeacher } from '~/stores/groupTeachers'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const groupsStore = useGroupsStore()
const groupTeachersStore = useGroupTeachersStore()

const groupId = route.params.id as string
const loading = ref(true)
const error = ref('')
const editingAssignment = ref<GroupTeacher | null>(null)
const currentAssignments = ref<GroupTeacher[]>([])

const listKey = ref(0)
const formKey = ref(0)

const currentTeacherIds = computed(() => {
  return currentAssignments.value
    .filter(a => !a.end_date || new Date(a.end_date) >= new Date())
    .map(a => a.teacher_id)
})

onMounted(async () => {
  try {
    const group = await groupsStore.fetchGroupById(groupId)
    if (!group) {
      error.value = 'Group not found'
      return
    }

    await loadAssignments()

    // Check if editing from query param
    const editId = route.query.edit as string
    if (editId) {
      const assignment = currentAssignments.value.find(a => a.id === editId)
      if (assignment) {
        editingAssignment.value = assignment
      }
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load group'
  } finally {
    loading.value = false
  }
})

const loadAssignments = async () => {
  try {
    await groupTeachersStore.fetchGroupTeachers(groupId)
    currentAssignments.value = groupTeachersStore.assignments
  } catch (e: any) {
    console.error('Error loading assignments:', e)
  }
}

const handleSubmit = async (data: any) => {
  try {
    console.log('Submitting assignment:', data)
    
    if (editingAssignment.value) {
      await groupTeachersStore.updateAssignment(editingAssignment.value.id, data)
      alert('Assignment updated successfully!')
    } else {
      const result = await groupTeachersStore.assignTeacherToGroup(data)
      console.log('Assignment created:', result)
      alert('Teacher assigned successfully!')
    }
    
    editingAssignment.value = null
    await loadAssignments()
    listKey.value++
    formKey.value++
  } catch (e: any) {
    console.error('Error saving assignment:', e)
    const errorMessage = e.message || e.error?.message || 'Failed to save assignment'
    alert(errorMessage)
    
    // Provide helpful error messages
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      alert('Database table not found. Please run the migration: supabase/migrations/enhance-group-teacher-assignment.sql')
    } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
      alert('Permission denied. Please check RLS policies in Supabase.')
    } else if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      alert('This teacher is already assigned to this group.')
    }
  }
}

const handleEdit = (assignment: GroupTeacher) => {
  editingAssignment.value = assignment
  formKey.value++
}

const handleCancel = () => {
  editingAssignment.value = null
  formKey.value++
}

const handleDelete = async (assignment: GroupTeacher) => {
  if (!confirm('Are you sure you want to remove this teacher from the group?')) return

  try {
    await groupTeachersStore.removeTeacherFromGroup(assignment.id)
    await loadAssignments()
    listKey.value++
    alert('Teacher removed successfully!')
  } catch (e: any) {
    alert(e.message || 'Failed to remove teacher')
  }
}

const handleSetPrimary = async (assignment: GroupTeacher) => {
  try {
    await groupTeachersStore.setPrimaryTeacher(groupId, assignment.teacher_id)
    await loadAssignments()
    listKey.value++
    alert('Primary teacher updated successfully!')
  } catch (e: any) {
    alert(e.message || 'Failed to set primary teacher')
  }
}
</script>
