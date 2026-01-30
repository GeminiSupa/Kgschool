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
        <p v-if="!groupsLoading && groups.length === 0 && props.teacherGroupsOnly" class="mt-1 text-sm text-yellow-600">
          ⚠️ No groups assigned to you. Please contact an admin to assign you to a group.
        </p>
      </div>

      <div>
        <label for="report_date" class="block text-sm font-medium text-gray-700 mb-2">
          Date <span class="text-red-500">*</span>
        </label>
        <input
          id="report_date"
          v-model="form.report_date"
          type="date"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
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
          placeholder="e.g., A Wonderful Day in Group A"
        />
      </div>

      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
          Content <span class="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          v-model="form.content"
          rows="6"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Describe what happened today..."
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
          placeholder="Morning circle&#10;Free play&#10;Outdoor time"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="weather" class="block text-sm font-medium text-gray-700 mb-2">
            Weather
          </label>
          <input
            id="weather"
            v-model="form.weather"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Sunny, 20°C"
          />
        </div>

        <div>
          <label for="special_events" class="block text-sm font-medium text-gray-700 mb-2">
            Special Events
          </label>
          <input
            id="special_events"
            v-model="form.special_events"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Birthday celebration"
          />
        </div>
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
          {{ loading ? 'Creating...' : 'Create Report' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import { useAuthStore } from '~/stores/auth'

interface Props {
  teacherGroupsOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  teacherGroupsOnly: false
})

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const { groups: allGroups, loading: groupsLoading, error: groupsError } = storeToRefs(groupsStore)

const groups = computed(() => {
  if (props.teacherGroupsOnly) {
    const userId = authStore.user?.id
    if (!userId) return []
    return allGroups.value.filter(g => g.educator_id === userId)
  }
  return allGroups.value
})

const form = ref({
  group_id: '',
  report_date: new Date().toISOString().split('T')[0],
  title: '',
  content: '',
  activities: [] as string[],
  weather: '',
  special_events: '',
  photos: [] as string[]
})

const activitiesText = ref('')
const loading = ref(false)
const error = ref('')

const isFormValid = computed(() => {
  return form.value.group_id &&
    form.value.report_date &&
    form.value.title &&
    form.value.content.trim()
})

watch(activitiesText, (newVal) => {
  form.value.activities = newVal
    .split('\n')
    .map(a => a.trim())
    .filter(a => a.length > 0)
})

onMounted(async () => {
  await groupsStore.fetchGroups()
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    emit('submit', {
      ...form.value,
      activities: form.value.activities
    })
  } catch (e: any) {
    error.value = e.message || 'Failed to submit form'
    loading.value = false
  }
}
</script>
