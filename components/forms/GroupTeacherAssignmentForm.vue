<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="teacher_id" class="block text-sm font-medium text-gray-700 mb-2">
        Teacher <span class="text-red-500">*</span>
      </label>
      <select
        id="teacher_id"
        v-model="form.teacher_id"
        required
        :disabled="teachersLoading"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{{ teachersLoading ? 'Loading teachers...' : 'Select teacher' }}</option>
        <option v-for="teacher in availableTeachers" :key="teacher.id" :value="teacher.id">
          {{ teacher.full_name }}
        </option>
      </select>
    </div>

    <div>
      <label for="role" class="block text-sm font-medium text-gray-700 mb-2">
        Role <span class="text-red-500">*</span>
      </label>
      <select
        id="role"
        v-model="form.role"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="primary">Primary Teacher</option>
        <option value="assistant">Assistant Teacher</option>
        <option value="support">Support Staff</option>
      </select>
      <p class="text-xs text-gray-500 mt-1">
        Primary teacher is the group leader. Only one primary teacher per group.
      </p>
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
          :min="form.start_date"
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
        :disabled="loading || !isFormValid"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Saving...' : 'Save Assignment' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import type { GroupTeacher } from '~/stores/groupTeachers'

interface Props {
  groupId: string
  initialData?: GroupTeacher
  excludeTeacherIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  excludeTeacherIds: () => []
})

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const supabase = useSupabaseClient()
const teachers = ref<any[]>([])
const teachersLoading = ref(true)
const loading = ref(false)
const error = ref('')

const form = ref({
  teacher_id: props.initialData?.teacher_id || '',
  role: props.initialData?.role || 'assistant',
  start_date: props.initialData?.start_date || new Date().toISOString().split('T')[0],
  end_date: props.initialData?.end_date || '',
  notes: props.initialData?.notes || ''
})

const availableTeachers = computed(() => {
  return teachers.value.filter(t => !props.excludeTeacherIds.includes(t.id))
})

const isFormValid = computed(() => {
  return form.value.teacher_id && form.value.role && form.value.start_date
})

onMounted(async () => {
  await loadTeachers()
})

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value = {
      teacher_id: newVal.teacher_id || '',
      role: newVal.role || 'assistant',
      start_date: newVal.start_date || new Date().toISOString().split('T')[0],
      end_date: newVal.end_date || '',
      notes: newVal.notes || ''
    }
  } else {
    // Reset form for new assignment
    form.value = {
      teacher_id: '',
      role: 'assistant',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: ''
    }
  }
}, { deep: true, immediate: true })

const loadTeachers = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['teacher', 'support'])
      .order('full_name')

    if (fetchError) throw fetchError
    teachers.value = data || []
  } catch (e: any) {
    error.value = e.message || 'Failed to load teachers'
  } finally {
    teachersLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const assignmentData: any = {
      ...form.value,
      group_id: props.groupId
    }

    if (!assignmentData.end_date) {
      delete assignmentData.end_date
    }

    if (!assignmentData.notes || assignmentData.notes.trim() === '') {
      delete assignmentData.notes
    }

    emit('submit', assignmentData)
    
    // Reset form if not editing
    if (!props.initialData) {
      form.value = {
        teacher_id: '',
        role: 'assistant',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
      }
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to submit form'
  } finally {
    loading.value = false
  }
}
</script>
