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
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">
              Assigned Teachers
            </label>
          </div>
          <GroupTeacherList
            :group-id="route.params.id as string"
            :can-edit="false"
            :can-delete="false"
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
import GroupTeacherList from '~/components/groups/GroupTeacherList.vue'
import GroupCapacityIndicator from '~/components/groups/GroupCapacityIndicator.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const route = useRoute()
const groupsStore = useGroupsStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()

const group = ref<any>(null)
const loading = ref(true)
const error = ref('')
const childrenInGroup = ref<any[]>([])
const capacity = ref({ current: 0, max: 0, available: 0 })

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
  } catch (e: any) {
    error.value = e.message || 'Failed to load group'
  } finally {
    loading.value = false
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE')
}
</script>
