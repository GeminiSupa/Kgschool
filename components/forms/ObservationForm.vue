<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <div>
        <label for="child_id" class="block text-sm font-medium text-gray-700 mb-2">
          Child <span class="text-red-500">*</span>
        </label>
        <select
          id="child_id"
          v-model="form.child_id"
          required
          :disabled="childrenLoading"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{{ childrenLoading ? 'Loading children...' : 'Select a child' }}</option>
          <option v-for="child in children" :key="child.id" :value="child.id">
            {{ child.first_name }} {{ child.last_name }}
          </option>
        </select>
        <p v-if="childrenError" class="mt-1 text-sm text-red-600">
          Error loading children: {{ childrenError.message }}
        </p>
      </div>

      <div>
        <label for="observation_date" class="block text-sm font-medium text-gray-700 mb-2">
          Date <span class="text-red-500">*</span>
        </label>
        <input
          id="observation_date"
          v-model="form.observation_date"
          type="date"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="context" class="block text-sm font-medium text-gray-700 mb-2">
          Context (Where/When)
        </label>
        <input
          id="context"
          v-model="form.context"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., During free play, Morning circle"
        />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Description <span class="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="6"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Describe what you observed..."
        />
      </div>

      <div>
        <label for="development_area" class="block text-sm font-medium text-gray-700 mb-2">
          Development Area
        </label>
        <select
          id="development_area"
          v-model="form.development_area"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select area</option>
          <option value="Social">Social</option>
          <option value="Motor">Motor</option>
          <option value="Language">Language</option>
          <option value="Cognitive">Cognitive</option>
          <option value="Emotional">Emotional</option>
          <option value="Creative">Creative</option>
        </select>
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
          {{ loading ? 'Creating...' : 'Create Observation' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChildrenStore } from '~/stores/children'

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const childrenStore = useChildrenStore()
const { children, loading: childrenLoading, error: childrenError } = storeToRefs(childrenStore)

const form = ref({
  child_id: '',
  observation_date: new Date().toISOString().split('T')[0],
  context: '',
  description: '',
  development_area: '',
  photos: [] as string[],
  videos: [] as string[]
})

const loading = ref(false)
const error = ref('')

const isFormValid = computed(() => {
  return form.value.child_id &&
    form.value.observation_date &&
    form.value.description.trim()
})

onMounted(async () => {
  await childrenStore.fetchChildren()
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
