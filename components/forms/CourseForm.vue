<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
        Course Name *
      </label>
      <input
        id="name"
        v-model="form.name"
        type="text"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., Mathematics, Art, Music"
      />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        id="description"
        v-model="form.description"
        rows="3"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Course description..."
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="age_range" class="block text-sm font-medium text-gray-700 mb-1">
          Age Range *
        </label>
        <select
          id="age_range"
          v-model="form.age_range"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select age range</option>
          <option value="U3">Under 3 (U3)</option>
          <option value="Ü3">Over 3 (Ü3)</option>
        </select>
      </div>

      <div>
        <label for="group_id" class="block text-sm font-medium text-gray-700 mb-1">
          Group
        </label>
        <select
          id="group_id"
          v-model="form.group_id"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select group</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }} ({{ group.age_range }})
          </option>
        </select>
      </div>
    </div>

    <div>
      <label for="teacher_id" class="block text-sm font-medium text-gray-700 mb-1">
        Teacher
      </label>
      <select
        id="teacher_id"
        v-model="form.teacher_id"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select teacher</option>
        <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
          {{ teacher.full_name }}
        </option>
      </select>
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
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import type { Course } from '~/stores/courses'

interface Props {
  course?: Course
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const supabase = useSupabaseClient()
const groupsStore = useGroupsStore()
const isEdit = computed(() => !!props.course)
const loading = ref(false)
const error = ref('')
const teachers = ref<any[]>([])
const groups = ref<any[]>([])

const form = ref({
  name: props.course?.name || '',
  description: props.course?.description || '',
  age_range: props.course?.age_range || '',
  group_id: props.course?.group_id || '',
  teacher_id: props.course?.teacher_id || ''
})

onMounted(async () => {
  await Promise.all([
    groupsStore.fetchGroups(),
    fetchTeachers()
  ])
  groups.value = groupsStore.groups
})

const fetchTeachers = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('full_name')

  teachers.value = data || []
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    emit('submit', form.value)
  } catch (e: any) {
    error.value = e.message || 'Failed to save course'
  } finally {
    loading.value = false
  }
}
</script>
