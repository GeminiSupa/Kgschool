<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/admin/groups"
        class="text-gray-600 hover:text-gray-900"
      >
        ← Back to Groups
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="group" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="xl" class="mb-6">{{ group.name }}</Heading>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-600">Age Range</label>
            <p class="mt-1 text-gray-900">{{ group.age_range }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">Capacity</label>
            <GroupCapacityIndicator
              :current="capacity.current"
              :max="capacity.max"
            />
          </div>
        </div>

        <div class="pt-4 border-t space-y-4">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">
              Assigned Teachers
            </label>
            <NuxtLink
              :to="`/admin/groups/${route.params.id}/assign-teachers`"
              class="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage Teachers →
            </NuxtLink>
          </div>
          <GroupTeacherList
            :group-id="route.params.id as string"
            :can-edit="true"
            :can-delete="true"
            @edit="handleEditTeacher"
            @delete="handleDeleteTeacher"
            @set-primary="handleSetPrimary"
            :key="teacherListKey"
          />
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Children in Group</Heading>
        <div v-if="childrenInGroup.length === 0" class="text-gray-500 text-sm">
          No children in this group yet.
        </div>
        <div v-else class="space-y-2">
          <NuxtLink
            v-for="child in childrenInGroup"
            :key="child.id"
            :to="`/admin/children/${child.id}`"
            class="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <p class="font-medium">{{ child.first_name }} {{ child.last_name }}</p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useGroupsStore } from '~/stores/groups'
import { useChildrenStore } from '~/stores/children'
import { useGroupTeachersStore } from '~/stores/groupTeachers'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import GroupTeacherList from '~/components/groups/GroupTeacherList.vue'
import GroupCapacityIndicator from '~/components/groups/GroupCapacityIndicator.vue'
import type { GroupTeacher } from '~/stores/groupTeachers'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const groupsStore = useGroupsStore()
const childrenStore = useChildrenStore()
const groupTeachersStore = useGroupTeachersStore()

const group = ref<any>(null)
const loading = ref(true)
const error = ref('')
const childrenInGroup = ref<any[]>([])
const capacity = ref({ current: 0, max: 0, available: 0 })
const teacherListKey = ref(0)

const { groups } = storeToRefs(groupsStore)
const { children } = storeToRefs(childrenStore)

onMounted(async () => {
  try {
    await Promise.all([
      groupsStore.fetchGroups(),
      childrenStore.fetchChildren()
    ])

    const groupData = await groupsStore.fetchGroupById(route.params.id as string)
    if (!groupData) {
      error.value = 'Group not found'
      return
    }

    group.value = groupData

    // Get children in this group - ensure children is an array
    const childrenArray = Array.isArray(children.value) ? children.value : []
    childrenInGroup.value = childrenArray.filter(c => c.group_id === groupData.id)

    // Get capacity
    capacity.value = await groupsStore.getGroupCapacity(groupData.id)
  } catch (e: any) {
    error.value = e.message || 'Failed to load group'
  } finally {
    loading.value = false
  }
})

const handleEditTeacher = (teacher: GroupTeacher) => {
  // Navigate to assign-teachers page with edit mode
  navigateTo(`/admin/groups/${route.params.id}/assign-teachers?edit=${teacher.id}`)
}

const handleDeleteTeacher = async (teacher: GroupTeacher) => {
  if (!confirm(`Are you sure you want to remove ${teacher.role} from this group?`)) return

  try {
    await groupTeachersStore.removeTeacherFromGroup(teacher.id)
    teacherListKey.value++ // Refresh list
    alert('Teacher removed successfully')
  } catch (e: any) {
    alert(e.message || 'Failed to remove teacher')
  }
}

const handleSetPrimary = async (teacher: GroupTeacher) => {
  try {
    await groupTeachersStore.setPrimaryTeacher(route.params.id as string, teacher.teacher_id)
    teacherListKey.value++ // Refresh list
    alert('Primary teacher updated successfully')
  } catch (e: any) {
    alert(e.message || 'Failed to set primary teacher')
  }
}
</script>
