<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/teacher/dashboard"
        class="text-gray-600 hover:text-gray-900"
      >
        ← Back to Dashboard
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
          <div class="flex items-center justify-between mb-4">
            <Heading size="md">Assigned Teachers</Heading>
          </div>
          <div v-if="teachersLoading" class="text-center py-8 text-gray-500">
            Loading teachers...
          </div>
          <div v-else-if="assignedTeachers.length === 0" class="text-center py-8 text-gray-500">
            <p>No teachers assigned to this group yet.</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="assignment in assignedTeachers"
              :key="assignment.id"
              class="p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  {{ getTeacherInitials(assignment.teacher_id) }}
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-gray-900">{{ getTeacherName(assignment.teacher_id) }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span
                      :class="[
                        'px-2.5 py-1 text-xs font-semibold rounded-full',
                        assignment.role === 'primary' ? 'bg-blue-500 text-white' :
                        assignment.role === 'assistant' ? 'bg-green-500 text-white' :
                        'bg-gray-400 text-white'
                      ]"
                    >
                      {{ formatRole(assignment.role) }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ formatDate(assignment.start_date) }}
                      <span v-if="!assignment.end_date" class="text-green-600 ml-1">(Active)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            :to="`/teacher/children/${child.id}`"
            class="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <p class="font-medium">{{ child.first_name }} {{ child.last_name }}</p>
            <p class="text-sm text-gray-600 mt-1">
              Date of Birth: {{ formatDate(child.date_of_birth) }}
            </p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import { useChildrenStore } from '~/stores/children'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import GroupCapacityIndicator from '~/components/groups/GroupCapacityIndicator.vue'
import { useGroupTeachersStore } from '~/stores/groupTeachers'
import type { GroupTeacher } from '~/stores/groupTeachers'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const route = useRoute()
const groupsStore = useGroupsStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()
const groupTeachersStore = useGroupTeachersStore()
const supabase = useSupabaseClient()

const group = ref<any>(null)
const loading = ref(true)
const error = ref('')
const childrenInGroup = ref<any[]>([])
const capacity = ref({ current: 0, max: 0, available: 0 })
const assignedTeachers = ref<GroupTeacher[]>([])
const teachersLoading = ref(false)
const teachers = ref<any[]>([])
const teacherNames = ref<Record<string, string>>({})

const { children } = storeToRefs(childrenStore)

onMounted(async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) {
      error.value = 'User not authenticated'
      return
    }

    // Verify teacher is assigned to this group
    const supabase = useSupabaseClient()
    const { data: assignment } = await supabase
      .from('group_teachers')
      .select('*')
      .eq('group_id', route.params.id as string)
      .eq('teacher_id', userId)
      .is('end_date', null)
      .single()

    if (!assignment) {
      error.value = 'You are not assigned to this group'
      return
    }

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
    childrenInGroup.value = childrenArray.filter(c => c.group_id === groupData.id && c.status === 'active')

    // Get capacity
    capacity.value = await groupsStore.getGroupCapacity(groupData.id)

    // Load assigned teachers
    await loadAssignedTeachers()
  } catch (e: any) {
    error.value = e.message || 'Failed to load group'
  } finally {
    loading.value = false
  }
})

const loadAssignedTeachers = async () => {
  try {
    teachersLoading.value = true
    await groupTeachersStore.fetchGroupTeachers(route.params.id as string)
    assignedTeachers.value = groupTeachersStore.assignments

    // Load teacher names
    const teacherIds = [...new Set(assignedTeachers.value.map(t => t.teacher_id))]
    if (teacherIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)

      if (data) {
        data.forEach(profile => {
          teacherNames.value[profile.id] = profile.full_name
          teachers.value.push(profile)
        })
      }
    }
  } catch (e: any) {
    console.error('Error loading assigned teachers:', e)
  } finally {
    teachersLoading.value = false
  }
}

const getTeacherName = (teacherId: string) => {
  return teacherNames.value[teacherId] || teachers.value.find(t => t.id === teacherId)?.full_name || teacherId
}

const getTeacherInitials = (teacherId: string) => {
  const name = getTeacherName(teacherId)
  return name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    primary: 'Primary Teacher',
    assistant: 'Assistant Teacher',
    support: 'Support Staff'
  }
  return roles[role] || role
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE')
}
</script>
