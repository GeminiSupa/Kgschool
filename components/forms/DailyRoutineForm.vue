<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <div>
        <label for="group_id" class="block text-sm font-medium text-gray-700 mb-2">
          Group <span class="text-red-500">*</span>
        </label>
        <select
          id="group_id"
          v-model="form.group_id"
          required
          :disabled="groupsLoading"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{{ groupsLoading ? 'Loading groups...' : 'Select a group' }}</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
        <p v-if="groupsError" class="mt-1 text-sm text-red-600">
          Error loading groups: {{ groupsError.message }}
        </p>
      </div>

      <div>
        <label for="routine_name" class="block text-sm font-medium text-gray-700 mb-2">
          Routine Name <span class="text-red-500">*</span>
        </label>
        <input
          id="routine_name"
          v-model="form.routine_name"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Morning Circle, Nap Time"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="start_time" class="block text-sm font-medium text-gray-700 mb-2">
            Start Time <span class="text-red-500">*</span>
          </label>
          <input
            id="start_time"
            v-model="form.start_time"
            type="time"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label for="end_time" class="block text-sm font-medium text-gray-700 mb-2">
            End Time
          </label>
          <input
            id="end_time"
            v-model="form.end_time"
            type="time"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label for="day_of_week" class="block text-sm font-medium text-gray-700 mb-2">
          Day of Week (leave empty for every day)
        </label>
        <select
          id="day_of_week"
          v-model="dayOfWeekValue"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option :value="null">Every Day</option>
          <option :value="0">Sunday</option>
          <option :value="1">Monday</option>
          <option :value="2">Tuesday</option>
          <option :value="3">Wednesday</option>
          <option :value="4">Thursday</option>
          <option :value="5">Friday</option>
          <option :value="6">Saturday</option>
        </select>
      </div>

      <div>
        <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          id="location"
          v-model="form.location"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Indoor, Outdoor, Gym"
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
          placeholder="Describe the routine..."
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
          {{ loading ? 'Creating...' : 'Create Routine' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGroupsStore } from '~/stores/groups'

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const groupsStore = useGroupsStore()
const { groups, loading: groupsLoading, error: groupsError } = storeToRefs(groupsStore)

const form = ref({
  group_id: '',
  routine_name: '',
  start_time: '',
  end_time: '',
  day_of_week: null as number | null,
  description: '',
  location: '',
  is_active: true
})

const dayOfWeekValue = ref<number | null>(null)
const loading = ref(false)
const error = ref('')

watch(dayOfWeekValue, (newVal) => {
  form.value.day_of_week = newVal
})

const isFormValid = computed(() => {
  return form.value.group_id &&
    form.value.routine_name &&
    form.value.start_time
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

  emit('submit', form.value)
}
</script>
