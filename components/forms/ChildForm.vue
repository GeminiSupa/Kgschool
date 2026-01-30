<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="first_name" class="form-label-fiori form-label-fiori-required">
          Vorname
        </label>
        <input
          id="first_name"
          v-model="form.first_name"
          type="text"
          required
          class="input-fiori"
        />
      </div>

      <div>
        <label for="last_name" class="form-label-fiori form-label-fiori-required">
          Nachname
        </label>
        <input
          id="last_name"
          v-model="form.last_name"
          type="text"
          required
          class="input-fiori"
        />
      </div>
    </div>

    <div>
      <label for="date_of_birth" class="form-label-fiori form-label-fiori-required">
        Geburtsdatum
      </label>
      <input
        id="date_of_birth"
        v-model="form.date_of_birth"
        type="date"
        required
        class="input-fiori"
      />
    </div>

    <div>
      <label for="enrollment_date" class="form-label-fiori form-label-fiori-required">
        Einschulungsdatum
      </label>
      <input
        id="enrollment_date"
        v-model="form.enrollment_date"
        type="date"
        required
        class="input-fiori"
      />
    </div>

    <div>
      <label for="group_id" class="form-label-fiori">
        Gruppe
      </label>
      <select
        id="group_id"
        v-model="form.group_id"
        @change="onGroupChange"
        class="input-fiori"
      >
        <option value="">Unassigned</option>
        <option v-for="group in sortedGroups" :key="group.id" :value="group.id">
          {{ group.name }} ({{ group.age_range }}) - {{ group.capacityInfo }}
        </option>
      </select>
      
      <!-- Show suggestions if no group selected -->
      <div v-if="!form.group_id && suggestions.length > 0" class="mt-2 p-3 alert-fiori alert-fiori-info">
        <p class="text-sm font-medium mb-2">Vorgeschlagene Gruppen:</p>
        <div class="space-y-1">
          <button
            v-for="suggestion in suggestions.slice(0, 3)"
            :key="suggestion.group.id"
            type="button"
            @click="form.group_id = suggestion.group.id; onGroupChange()"
            :class="[
              'text-left w-full px-3 py-2 text-sm rounded-md border transition-colors',
              suggestion.match === 'perfect' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
              suggestion.match === 'good' ? 'bg-fiori-blue-50 border-fiori-blue-200 hover:bg-fiori-blue-100' :
              'bg-fiori-gray-50 border-fiori-gray-200 hover:bg-fiori-gray-100'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ suggestion.group.name }} ({{ suggestion.group.age_range }})</span>
              <span class="text-xs text-fiori-gray-600">{{ suggestion.reason }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Show capacity warning for selected group -->
      <div v-if="form.group_id && selectedGroupCapacity" class="mt-2">
        <GroupCapacityIndicator
          :current="selectedGroupCapacity.current"
          :max="selectedGroupCapacity.max"
        />
        <p v-if="selectedGroupCapacity.warning" class="text-xs text-orange-600 mt-1">
          {{ selectedGroupCapacity.warning }}
        </p>
      </div>

      <!-- Show teachers for selected group -->
      <div v-if="form.group_id && selectedGroupTeachers.length > 0" class="mt-2 p-2 bg-fiori-gray-50 rounded-md">
        <p class="text-xs font-medium text-fiori-gray-700 mb-1">Zugewiesene Lehrer:</p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="teacher in selectedGroupTeachers"
            :key="teacher.id"
            class="badge-fiori badge-fiori-neutral"
          >
            {{ teacher.full_name }} ({{ teacher.role === 'primary' ? 'Primary' : teacher.role }})
          </span>
        </div>
      </div>
    </div>

    <div>
      <label for="status" class="form-label-fiori">
        Status
      </label>
      <select
        id="status"
        v-model="form.status"
        class="input-fiori"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="pending">Pending</option>
      </select>
    </div>

    <div>
      <ParentSelector v-model="form.parent_ids" />
      <p v-if="form.parent_ids.length === 0" class="text-xs text-red-600 mt-1">
        At least one parent must be selected
      </p>
    </div>

    <div v-if="error" class="alert-fiori alert-fiori-error">
      {{ error }}
    </div>

    <div class="flex gap-3 justify-end pt-4">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn-fiori-secondary"
      >
        Abbrechen
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="btn-fiori-primary"
      >
        {{ loading ? 'Wird gespeichert...' : (isEdit ? 'Aktualisieren' : 'Erstellen') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import { useGroupsStore } from '~/stores/groups'
import { useGroupTeachersStore } from '~/stores/groupTeachers'
import type { Child } from '~/stores/children'
import ParentSelector from '~/components/forms/ParentSelector.vue'
import GroupCapacityIndicator from '~/components/groups/GroupCapacityIndicator.vue'
import { suggestGroupsForChild, calculateAgeRange, checkGroupCapacity } from '~/utils/groupAssignment'

interface Props {
  child?: Child
  groups?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const supabase = useSupabaseClient()
const groupsStore = useGroupsStore()
const groupTeachersStore = useGroupTeachersStore()
const isEdit = computed(() => !!props.child)
const loading = ref(false)
const error = ref('')

const form = ref({
  first_name: props.child?.first_name || '',
  last_name: props.child?.last_name || '',
  date_of_birth: props.child?.date_of_birth || '',
  enrollment_date: props.child?.enrollment_date || new Date().toISOString().split('T')[0],
  group_id: props.child?.group_id || '',
  status: props.child?.status || 'active',
  parent_ids: props.child?.parent_ids || []
})

const groups = ref(props.groups || [])
const groupCapacities = ref<Record<string, { current: number; max: number; available: number }>>({})
const groupTeachers = ref<Record<string, any[]>>({})
const suggestions = ref<Array<{ group: any; match: string; reason: string }>>([])
const selectedGroupCapacity = ref<{ current: number; max: number; available: number; warning: string | null } | null>(null)
const selectedGroupTeachers = ref<any[]>([])

const sortedGroups = computed(() => {
  return groups.value.map(group => {
    const capacity = groupCapacities.value[group.id] || { current: 0, max: group.capacity, available: group.capacity }
    const capacityInfo = capacity.available > 0 
      ? `${capacity.current}/${capacity.max} (${capacity.available} available)`
      : `${capacity.current}/${capacity.max} (Full)`
    return {
      ...group,
      capacityInfo
    }
  })
})

onMounted(async () => {
  if (!props.groups || props.groups.length === 0) {
    await groupsStore.fetchGroups()
    groups.value = groupsStore.groups
  } else {
    groups.value = props.groups
  }

  await loadGroupData()
  generateSuggestions()
})

watch(() => form.value.date_of_birth, () => {
  generateSuggestions()
})

watch(() => form.value.group_id, async (newGroupId) => {
  if (newGroupId) {
    await loadSelectedGroupData(newGroupId)
  } else {
    selectedGroupCapacity.value = null
    selectedGroupTeachers.value = []
  }
})

const loadGroupData = async () => {
  // Load capacities for all groups
  for (const group of groups.value) {
    const capacity = await groupsStore.getGroupCapacity(group.id)
    groupCapacities.value[group.id] = capacity
  }
}

const loadSelectedGroupData = async (groupId: string) => {
  // Load capacity
  const capacity = await groupsStore.getGroupCapacity(groupId)
  const capacityCheck = checkGroupCapacity(groupId, capacity.current, capacity.max)
  selectedGroupCapacity.value = {
    ...capacity,
    warning: capacityCheck.warning
  }

  // Load teachers
  const teachers = await groupsStore.fetchGroupTeachers(groupId)
  selectedGroupTeachers.value = teachers || []
}

const generateSuggestions = async () => {
  if (!form.value.date_of_birth) {
    suggestions.value = []
    return
  }

  // Get current children counts
  const childrenCounts: Record<string, number> = {}
  for (const group of groups.value) {
    const capacity = groupCapacities.value[group.id] || await groupsStore.getGroupCapacity(group.id)
    childrenCounts[group.id] = capacity.current
    groupCapacities.value[group.id] = capacity
  }

  const childData = {
    date_of_birth: form.value.date_of_birth
  }

  suggestions.value = suggestGroupsForChild(
    childData,
    groups.value,
    childrenCounts
  )
}

const onGroupChange = async () => {
  if (form.value.group_id) {
    await loadSelectedGroupData(form.value.group_id)
  }
}

const handleSubmit = async () => {
  if (form.value.parent_ids.length === 0) {
    error.value = 'Please select at least one parent'
    return
  }

  // Validate group assignment if selected
  if (form.value.group_id && form.value.date_of_birth) {
    const selectedGroup = groups.value.find(g => g.id === form.value.group_id)
    if (selectedGroup) {
      const capacity = groupCapacities.value[selectedGroup.id] || await groupsStore.getGroupCapacity(selectedGroup.id)
      const validation = checkGroupCapacity(selectedGroup.id, capacity.current, capacity.max)
      
      if (!validation.available) {
        error.value = 'Selected group is at full capacity. Please choose another group.'
        return
      }
    }
  }

  loading.value = true
  error.value = ''

  try {
    emit('submit', form.value)
  } catch (e: any) {
    error.value = e.message || 'Failed to save child'
  } finally {
    loading.value = false
  }
}
</script>
