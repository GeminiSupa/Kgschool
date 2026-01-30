<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Group <span class="text-red-500">*</span>
      </label>
      <select
        v-model="form.group_id"
        required
        :disabled="!!timetableId"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      >
        <option value="">Select a group</option>
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }} ({{ group.age_range }})
        </option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Billable Days <span class="text-red-500">*</span>
      </label>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.monday"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm">Monday</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.tuesday"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm">Tuesday</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.wednesday"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm">Wednesday</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.thursday"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm">Thursday</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.friday"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm">Friday</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.saturday"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm">Saturday</span>
        </label>
        <label class="flex items-center space-x-2 cursor-pointer">
          <input
            v-model="form.sunday"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm">Sunday</span>
        </label>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Select which days of the week should be billable for this group.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Effective From <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.effective_from"
          type="date"
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Effective To (optional)
        </label>
        <input
          v-model="form.effective_to"
          type="date"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <p class="text-xs text-gray-500 mt-1">Leave empty for ongoing schedule</p>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Notes
      </label>
      <textarea
        v-model="form.notes"
        rows="3"
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Optional notes about this timetable..."
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
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Saving...' : (timetableId ? 'Update' : 'Create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGroupsStore } from '~/stores/groups'
import { useBillingTimetableStore } from '~/stores/billingTimetable'
import { storeToRefs } from 'pinia'

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const props = defineProps<{
  timetableId?: string
}>()

const groupsStore = useGroupsStore()
const timetableStore = useBillingTimetableStore()

const { groups } = storeToRefs(groupsStore)
const { loading } = storeToRefs(timetableStore)

const error = ref('')

const form = ref({
  group_id: '',
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
  effective_from: new Date().toISOString().split('T')[0],
  effective_to: '',
  notes: ''
})

const isFormValid = computed(() => {
  return !!form.value.group_id && 
         (form.value.monday || form.value.tuesday || form.value.wednesday || 
          form.value.thursday || form.value.friday || form.value.saturday || form.value.sunday)
})

onMounted(async () => {
  await groupsStore.fetchGroups()
  
  if (props.timetableId) {
    await loadTimetable()
  }
})

const loadTimetable = async () => {
  try {
    const timetable = await timetableStore.fetchTimetableById(props.timetableId!)
    if (timetable) {
      form.value = {
        group_id: timetable.group_id,
        monday: timetable.monday,
        tuesday: timetable.tuesday,
        wednesday: timetable.wednesday,
        thursday: timetable.thursday,
        friday: timetable.friday,
        saturday: timetable.saturday,
        sunday: timetable.sunday,
        effective_from: timetable.effective_from,
        effective_to: timetable.effective_to || '',
        notes: timetable.notes || ''
      }
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load timetable'
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields and select at least one day'
    return
  }

  error.value = ''
  
  try {
    const submitData = {
      ...form.value,
      effective_to: form.value.effective_to || null
    }

    if (props.timetableId) {
      await timetableStore.updateTimetable(props.timetableId, submitData)
    } else {
      await timetableStore.createTimetable(submitData)
    }

    emit('submit', submitData)
  } catch (e: any) {
    error.value = e.message || 'Failed to save timetable'
  }
}
</script>
