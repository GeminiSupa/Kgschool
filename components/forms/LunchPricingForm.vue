<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="group_id" class="block text-sm font-medium text-gray-700 mb-2">
        Group <span class="text-red-500">*</span>
      </label>
      <select
        id="group_id"
        v-model="form.group_id"
        required
        :disabled="isEdit || groupsLoading"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{{ groupsLoading ? 'Loading groups...' : 'Select a group' }}</option>
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }} ({{ group.age_range }})
        </option>
      </select>
    </div>

    <div>
      <label for="price_per_meal" class="block text-sm font-medium text-gray-700 mb-2">
        Price per Meal (€) <span class="text-red-500">*</span>
      </label>
      <input
        id="price_per_meal"
        v-model.number="form.price_per_meal"
        type="number"
        step="0.01"
        min="0"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., 3.50"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="effective_from" class="block text-sm font-medium text-gray-700 mb-2">
          Effective From <span class="text-red-500">*</span>
        </label>
        <input
          id="effective_from"
          v-model="form.effective_from"
          type="date"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="effective_to" class="block text-sm font-medium text-gray-700 mb-2">
          Effective To (Optional)
        </label>
        <input
          id="effective_to"
          v-model="form.effective_to"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <p class="text-xs text-gray-500 mt-1">Leave empty for ongoing pricing</p>
      </div>
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
        {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGroupsStore } from '~/stores/groups'
import type { LunchPricing } from '~/stores/lunchPricing'

interface Props {
  pricing?: LunchPricing
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: Partial<LunchPricing>]
  cancel: []
}>()

const groupsStore = useGroupsStore()
const { groups, loading: groupsLoading } = storeToRefs(groupsStore)

const isEdit = computed(() => !!props.pricing)
const loading = ref(false)
const error = ref('')

const form = ref({
  group_id: props.pricing?.group_id || '',
  price_per_meal: props.pricing?.price_per_meal || 0,
  effective_from: props.pricing?.effective_from || new Date().toISOString().split('T')[0],
  effective_to: props.pricing?.effective_to || ''
})

const isFormValid = computed(() => {
  return form.value.group_id &&
    form.value.price_per_meal > 0 &&
    form.value.effective_from
})

onMounted(async () => {
  await groupsStore.fetchGroups()
})

const handleSubmit = () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''

  const submitData = {
    ...form.value,
    effective_to: form.value.effective_to || null
  }

  emit('submit', submitData)
}
</script>
