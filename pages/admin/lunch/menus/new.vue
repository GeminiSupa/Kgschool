<template>
  <div>
    <Heading size="xl" class="mb-6">Create Lunch Menu</Heading>
    
    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="date" class="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            id="date"
            v-model="form.date"
            type="date"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="meal_name" class="block text-sm font-medium text-gray-700 mb-1">
            Meal Name *
          </label>
          <input
            id="meal_name"
            v-model="form.meal_name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Vegetable Pasta"
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
            placeholder="Meal description..."
          />
        </div>

        <div>
          <label for="allergens" class="block text-sm font-medium text-gray-700 mb-1">
            Allergens (comma-separated)
          </label>
          <input
            id="allergens"
            v-model="allergensInput"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Nuts, Dairy"
          />
        </div>

        <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <NuxtLink
            to="/admin/lunch/menus"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ loading ? 'Creating...' : 'Create Menu' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLunchStore } from '~/stores/lunch'
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['admin', 'kitchen']
})

const router = useRouter()
const lunchStore = useLunchStore()

const loading = ref(false)
const error = ref('')
const allergensInput = ref('')

const form = ref({
  date: new Date().toISOString().split('T')[0],
  meal_name: '',
  description: '',
  allergens: [] as string[],
  nutritional_info: {}
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    form.value.allergens = allergensInput.value
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)

    await lunchStore.createMenu(form.value)
    await router.push('/admin/lunch/menus')
  } catch (e: any) {
    error.value = e.message || 'Failed to create menu'
  } finally {
    loading.value = false
  }
}
</script>
