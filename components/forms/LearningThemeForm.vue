<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Title <span class="text-red-500">*</span>
        </label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Nature Exploration"
        />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the learning theme..."
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="start_date" class="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            id="start_date"
            v-model="form.start_date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="end_date" class="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            id="end_date"
            v-model="form.end_date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
          Status <span class="text-red-500">*</span>
        </label>
        <select
          id="status"
          v-model="form.status"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="planned">Planned</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label for="learning_areas" class="block text-sm font-medium text-gray-700 mb-2">
          Learning Areas (one per line)
        </label>
        <textarea
          id="learning_areas"
          v-model="learningAreasText"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Social&#10;Motor&#10;Language"
        />
      </div>

      <div>
        <label for="activities" class="block text-sm font-medium text-gray-700 mb-2">
          Activities (one per line)
        </label>
        <textarea
          id="activities"
          v-model="activitiesText"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Activity 1&#10;Activity 2"
        />
      </div>

      <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
        {{ error }}
      </div>

      <div class="flex gap-3 justify-end">
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
          {{ loading ? 'Creating...' : 'Create Theme' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const form = ref({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  status: 'active' as 'active' | 'completed' | 'planned',
  learning_areas: [] as string[],
  activities: [] as string[],
  photos: [] as string[]
})

const learningAreasText = ref('')
const activitiesText = ref('')
const loading = ref(false)
const error = ref('')

watch(learningAreasText, (newVal) => {
  form.value.learning_areas = newVal
    .split('\n')
    .map(a => a.trim())
    .filter(a => a.length > 0)
})

watch(activitiesText, (newVal) => {
  form.value.activities = newVal
    .split('\n')
    .map(a => a.trim())
    .filter(a => a.length > 0)
})

const isFormValid = computed(() => {
  return form.value.title && form.value.status
})

const handleSubmit = () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''

  emit('submit', form.value)
}
</script>
