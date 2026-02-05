<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        :to="`/admin/lunch/menus/${menuId}`"
        class="text-blue-600 hover:text-blue-700 mb-4 inline-block"
      >
        ← Back to Menu
      </NuxtLink>
      <Heading size="xl" class="mb-1">Edit Lunch Menu</Heading>
      <p class="text-sm text-gray-500">Update menu details, allergens, and nutritional information</p>
    </div>

    <div v-if="loading && !menu" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error && !menu" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <IOSCard v-else customClass="max-w-2xl p-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Date -->
        <div>
          <label for="date" class="block text-sm font-semibold text-gray-700 mb-2">
            Date <span class="text-red-500">*</span>
          </label>
          <input
            id="date"
            v-model="form.date"
            type="date"
            required
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <!-- Meal Name -->
        <div>
          <label for="meal_name" class="block text-sm font-semibold text-gray-700 mb-2">
            Meal Name <span class="text-red-500">*</span>
          </label>
          <input
            id="meal_name"
            v-model="form.meal_name"
            type="text"
            required
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="e.g. Vegetable Pasta"
          />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="4"
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            placeholder="Meal description..."
          />
        </div>

        <!-- Allergens -->
        <div>
          <label for="allergens" class="block text-sm font-semibold text-gray-700 mb-2">
            Allergens (comma-separated)
          </label>
          <input
            id="allergens"
            v-model="allergensInput"
            type="text"
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="e.g. Nuts, Dairy, Gluten"
          />
          <p class="text-xs text-gray-500 mt-2">
            Enter allergens separated by commas. Common allergens: Gluten, Dairy, Nuts, Eggs, Fish, Soy
          </p>
          <div v-if="form.allergens.length > 0" class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="allergen in form.allergens"
              :key="allergen"
              class="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"
            >
              {{ allergen }}
              <button
                type="button"
                @click="removeAllergen(allergen)"
                class="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          </div>
        </div>

        <!-- Nutritional Information -->
        <div class="p-5 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-100">
          <Heading size="md" class="mb-4">Nutritional Information (Optional)</Heading>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="calories" class="block text-xs font-semibold text-gray-700 mb-1">
                Calories
              </label>
              <input
                id="calories"
                v-model.number="nutritionalInfo.calories"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. 450"
              />
            </div>
            <div>
              <label for="protein" class="block text-xs font-semibold text-gray-700 mb-1">
                Protein
              </label>
              <input
                id="protein"
                v-model="nutritionalInfo.protein"
                type="text"
                class="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. 20g"
              />
            </div>
            <div>
              <label for="carbs" class="block text-xs font-semibold text-gray-700 mb-1">
                Carbohydrates
              </label>
              <input
                id="carbs"
                v-model="nutritionalInfo.carbs"
                type="text"
                class="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. 50g"
              />
            </div>
            <div>
              <label for="fat" class="block text-xs font-semibold text-gray-700 mb-1">
                Fat
              </label>
              <input
                id="fat"
                v-model="nutritionalInfo.fat"
                type="text"
                class="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. 15g"
              />
            </div>
          </div>
        </div>

        <!-- Photo URL -->
        <div>
          <label for="photo_url" class="block text-sm font-semibold text-gray-700 mb-2">
            Photo URL (Optional)
          </label>
          <input
            id="photo_url"
            v-model="form.photo_url"
            type="url"
            class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="https://example.com/photo.jpg"
          />
          <p class="text-xs text-gray-500 mt-2">
            Enter a URL to an image of the meal
          </p>
          <div v-if="form.photo_url" class="mt-3">
            <img
              :src="form.photo_url"
              :alt="form.meal_name"
              class="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
              @error="photoError = true"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">
          ⚠️ {{ error }}
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <NuxtLink
            :to="`/admin/lunch/menus/${menuId}`"
            class="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </NuxtLink>
          <button
            type="button"
            @click="handleDelete"
            :disabled="submitting"
            class="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            🗑️ Delete
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
          >
            {{ submitting ? '⏳ Saving...' : '✅ Save Changes' }}
          </button>
        </div>
      </form>
    </IOSCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useLunchStore } from '~/stores/lunch'
import Heading from '~/components/ui/Heading.vue'
import IOSCard from '~/components/ui/IOSCard.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import type { LunchMenu } from '~/stores/lunch'

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['admin', 'kitchen']
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const lunchStore = useLunchStore()

const menuId = route.params.id as string
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const photoError = ref(false)
const menu = ref<LunchMenu | null>(null)
const allergensInput = ref('')

const form = ref({
  date: '',
  meal_name: '',
  description: '',
  allergens: [] as string[],
  nutritional_info: {} as Record<string, any>,
  photo_url: ''
})

const nutritionalInfo = ref({
  calories: '',
  protein: '',
  carbs: '',
  fat: ''
})

// Watch allergensInput and update form.allergens
watch(allergensInput, (newValue) => {
  form.value.allergens = newValue
    .split(',')
    .map(a => a.trim())
    .filter(a => a.length > 0)
})

// Watch nutritionalInfo and update form.nutritional_info
watch(nutritionalInfo, (newValue) => {
  const info: Record<string, any> = {}
  if (newValue.calories) info.calories = newValue.calories
  if (newValue.protein) info.protein = newValue.protein
  if (newValue.carbs) info.carbs = newValue.carbs
  if (newValue.fat) info.fat = newValue.fat
  form.value.nutritional_info = info
}, { deep: true })

onMounted(async () => {
  try {
    const { data: menuData, error: menuError } = await supabase
      .from('lunch_menus')
      .select('*')
      .eq('id', menuId)
      .single()

    if (menuError) throw menuError
    if (!menuData) {
      error.value = 'Menu not found'
      return
    }

    menu.value = menuData

    // Populate form
    form.value = {
      date: menuData.date,
      meal_name: menuData.meal_name,
      description: menuData.description || '',
      allergens: menuData.allergens || [],
      nutritional_info: menuData.nutritional_info || {},
      photo_url: menuData.photo_url || ''
    }

    // Populate allergens input
    allergensInput.value = (menuData.allergens || []).join(', ')

    // Populate nutritional info
    if (menuData.nutritional_info) {
      nutritionalInfo.value = {
        calories: menuData.nutritional_info.calories || '',
        protein: menuData.nutritional_info.protein || '',
        carbs: menuData.nutritional_info.carbs || '',
        fat: menuData.nutritional_info.fat || ''
      }
    }
  } catch (e: any) {
    console.error('Error loading menu:', e)
    error.value = e.message || 'Failed to load menu'
  } finally {
    loading.value = false
  }
})

const removeAllergen = (allergen: string) => {
  form.value.allergens = form.value.allergens.filter(a => a !== allergen)
  allergensInput.value = form.value.allergens.join(', ')
}

const handleSubmit = async () => {
  submitting.value = true
  error.value = ''

  try {
    // Update allergens from input
    form.value.allergens = allergensInput.value
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)

    // Update nutritional info
    const info: Record<string, any> = {}
    if (nutritionalInfo.value.calories) info.calories = nutritionalInfo.value.calories
    if (nutritionalInfo.value.protein) info.protein = nutritionalInfo.value.protein
    if (nutritionalInfo.value.carbs) info.carbs = nutritionalInfo.value.carbs
    if (nutritionalInfo.value.fat) info.fat = nutritionalInfo.value.fat
    form.value.nutritional_info = Object.keys(info).length > 0 ? info : {}

    await lunchStore.updateMenu(menuId, form.value)
    await router.push(`/admin/lunch/menus/${menuId}`)
  } catch (e: any) {
    console.error('Error updating menu:', e)
    error.value = e.message || 'Failed to update menu'
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this menu? This action cannot be undone.')) {
    return
  }

  submitting.value = true
  error.value = ''

  try {
    await lunchStore.deleteMenu(menuId)
    await router.push('/admin/lunch/menus')
  } catch (e: any) {
    console.error('Error deleting menu:', e)
    error.value = e.message || 'Failed to delete menu'
    submitting.value = false
  }
}
</script>
