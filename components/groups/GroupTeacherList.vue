<template>
  <div class="space-y-3">
    <div v-if="loading && !props.teachers" class="text-center py-4 text-gray-500 text-sm">
      Loading teachers...
    </div>

    <div v-else-if="teachers.length === 0" class="text-center py-4 text-gray-500 text-sm">
      No teachers assigned to this group yet.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="teacher in teachers"
        :key="teacher.id"
        class="p-3 bg-gray-50 rounded-md border border-gray-200"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-gray-900">{{ getTeacherName(teacher.teacher_id) }}</p>
              <span
                :class="[
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  teacher.role === 'primary'
                    ? 'bg-blue-100 text-blue-800'
                    : teacher.role === 'assistant'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ formatRole(teacher.role) }}
              </span>
            </div>
            <p class="text-sm text-gray-600">
              {{ formatDate(teacher.start_date) }}
              <span v-if="teacher.end_date">
                - {{ formatDate(teacher.end_date) }}
              </span>
              <span v-else class="text-green-600"> (Active)</span>
            </p>
            <p v-if="teacher.notes" class="text-xs text-gray-500 mt-1">
              {{ teacher.notes }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              v-if="canEdit && teacher.role !== 'primary'"
              @click="$emit('set-primary', teacher)"
              class="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="Set as primary teacher"
            >
              Set Primary
            </button>
            <button
              v-if="canEdit"
              @click="$emit('edit', teacher)"
              class="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              Edit
            </button>
            <button
              v-if="canDelete"
              @click="$emit('delete', teacher)"
              class="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import type { GroupTeacher } from '~/stores/groupTeachers'

interface Props {
  groupId: string
  teachers?: GroupTeacher[]
  canEdit?: boolean
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  teachers: undefined,
  canEdit: false,
  canDelete: false
})

const emit = defineEmits<{
  (e: 'edit', teacher: GroupTeacher): void
  (e: 'delete', teacher: GroupTeacher): void
  (e: 'set-primary', teacher: GroupTeacher): void
}>()

const supabase = useSupabaseClient()
const teachersList = ref<GroupTeacher[]>([])
const teacherNames = ref<Record<string, string>>({})
const loading = ref(false)

const teachers = computed(() => {
  return props.teachers || teachersList.value
})

onMounted(async () => {
  if (!props.teachers) {
    await fetchTeachers()
  }
  await fetchTeacherNames()
})

watch(() => props.groupId, () => {
  if (!props.teachers) {
    fetchTeachers()
  }
})

watch(() => props.teachers, () => {
  if (props.teachers) {
    fetchTeacherNames()
  }
})

const fetchTeachers = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('group_teachers')
      .select('*')
      .eq('group_id', props.groupId)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching teachers:', error)
      throw error
    }
    teachersList.value = data || []
    await fetchTeacherNames()
  } catch (e: any) {
    console.error('Error fetching teachers:', e)
    // Show error to user if RLS or table issues
    if (e.message?.includes('relation') || e.message?.includes('does not exist')) {
      console.error('Database table group_teachers does not exist. Please run migration: enhance-group-teacher-assignment.sql')
    } else if (e.message?.includes('permission') || e.message?.includes('policy')) {
      console.error('RLS policy blocking access. Please check RLS policies.')
    }
  } finally {
    loading.value = false
  }
}

const fetchTeacherNames = async () => {
  const teacherIds = [...new Set(teachers.value.map(t => t.teacher_id))]
  if (teacherIds.length === 0) return

  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds)

    if (data) {
      data.forEach(profile => {
        teacherNames.value[profile.id] = profile.full_name
      })
    }
  } catch (e: any) {
    console.error('Error fetching teacher names:', e)
  }
}

const getTeacherName = (teacherId: string) => {
  return teacherNames.value[teacherId] || teacherId
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
  return new Date(date).toLocaleDateString()
}
</script>
