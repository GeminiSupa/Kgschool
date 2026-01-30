<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Groups</Heading>
      <NuxtLink
        to="/admin/groups/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ Create Group
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="groups.length === 0" class="p-8 text-center text-gray-500">
        No groups created yet.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="group in groups"
          :key="group.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-lg font-medium text-gray-900">{{ group.name }}</p>
              <p class="text-sm text-gray-600 mt-1">
                Age Range: {{ group.age_range }} | Capacity: {{ group.capacity }}
              </p>
              <p v-if="group.educator_id" class="text-sm text-gray-500 mt-1">
                Teacher: {{ getTeacherName(group.educator_id) }}
              </p>
              <p v-else class="text-sm text-orange-600 mt-1">
                No teacher assigned
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
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const groupsStore = useGroupsStore()
const { groups, loading, error } = storeToRefs(groupsStore)
const teachers = ref<any[]>([])

onMounted(async () => {
  await Promise.all([
    groupsStore.fetchGroups(),
    fetchTeachers()
  ])
})

const fetchTeachers = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')

  teachers.value = data || []
}

const getTeacherName = (teacherId: string) => {
  const teacher = teachers.value.find(t => t.id === teacherId)
  return teacher ? teacher.full_name : teacherId
}
</script>
