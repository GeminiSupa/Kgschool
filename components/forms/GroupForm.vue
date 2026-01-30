<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
        Group Name *
      </label>
      <input
        id="name"
        v-model="form.name"
        type="text"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="e.g., Bears Group"
      />
    </div>

    <div>
      <label for="age_range" class="block text-sm font-medium text-gray-700 mb-1">
        Age Range *
      </label>
      <select
        id="age_range"
        v-model="form.age_range"
        required
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select age range</option>
        <option value="U3">Under 3 (U3)</option>
        <option value="Ü3">Over 3 (Ü3)</option>
      </select>
    </div>

    <div>
      <label for="capacity" class="block text-sm font-medium text-gray-700 mb-1">
        Capacity *
      </label>
      <input
        id="capacity"
        v-model.number="form.capacity"
        type="number"
        required
        min="1"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label for="educator_id" class="block text-sm font-medium text-gray-700 mb-1">
        Assigned Teacher
      </label>
      <select
        id="educator_id"
        v-model="form.educator_id"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">No teacher assigned</option>
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
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Group } from '~/stores/groups'

interface Props {
  group?: Group
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const supabase = useSupabaseClient()
const isEdit = computed(() => !!props.group)
const loading = ref(false)
const error = ref('')
const teachers = ref<any[]>([])

const form = ref({
  name: props.group?.name || '',
  age_range: props.group?.age_range || '',
  capacity: props.group?.capacity || 20,
  educator_id: props.group?.educator_id || ''
})

onMounted(async () => {
  // Fetch teachers
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('full_name')

  teachers.value = data || []
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    emit('submit', form.value)
  } catch (e: any) {
    error.value = e.message || 'Failed to save group'
  } finally {
    loading.value = false
  }
}
</script>
