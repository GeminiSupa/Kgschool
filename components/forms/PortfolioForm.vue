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
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Title <span class="text-red-500">*</span>
        </label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Artwork - Spring Flowers"
        />
      </div>

      <div>
        <label for="portfolio_type" class="block text-sm font-medium text-gray-700 mb-2">
          Type <span class="text-red-500">*</span>
        </label>
        <select
          id="portfolio_type"
          v-model="form.portfolio_type"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select type</option>
          <option value="artwork">Artwork</option>
          <option value="photo">Photo</option>
          <option value="achievement">Achievement</option>
          <option value="activity">Activity</option>
          <option value="milestone">Milestone</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
          Date <span class="text-red-500">*</span>
        </label>
        <input
          id="date"
          v-model="form.date"
          type="date"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Brief description..."
        />
      </div>

      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <textarea
          id="content"
          v-model="form.content"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Detailed content or notes..."
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
          {{ loading ? 'Creating...' : 'Create Portfolio Item' }}
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
  title: '',
  portfolio_type: '' as 'artwork' | 'photo' | 'achievement' | 'activity' | 'milestone' | 'other',
  description: '',
  content: '',
  date: new Date().toISOString().split('T')[0],
  attachments: [] as string[]
})

const loading = ref(false)
const error = ref('')

const isFormValid = computed(() => {
  return form.value.child_id &&
    form.value.title &&
    form.value.portfolio_type &&
    form.value.date
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
