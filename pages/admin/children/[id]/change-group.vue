<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        :to="`/admin/children/${childId}`"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Child Details
      </NuxtLink>
      <Heading size="xl">Change Child's Group</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="child" class="space-y-6">
      <!-- Current Group Info -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Current Assignment</Heading>
        <div v-if="currentGroup" class="space-y-2">
          <div>
            <label class="block text-sm font-medium text-gray-600">Current Group</label>
            <p class="mt-1 text-gray-900 font-medium">{{ currentGroup.name }} ({{ currentGroup.age_range }})</p>
          </div>
          <div v-if="currentGroupTeachers.length > 0">
            <label class="block text-sm font-medium text-gray-600 mb-1">Current Teachers</label>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="teacher in currentGroupTeachers"
                :key="teacher.id"
                class="px-2 py-1 text-xs bg-gray-100 rounded"
              >
                {{ teacher.full_name }} ({{ teacher.role === 'primary' ? 'Primary' : teacher.role }})
              </span>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-500">Child is not currently assigned to a group.</p>
      </div>

      <!-- New Group Selection -->
      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Select New Group</Heading>
        
        <div class="mb-4">
          <label for="new_group_id" class="block text-sm font-medium text-gray-700 mb-2">
            Group <span class="text-red-500">*</span>
          </label>
          <select
            id="new_group_id"
            v-model="form.new_group_id"
            @change="onGroupChange"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a group</option>
            <option v-for="group in availableGroups" :key="group.id" :value="group.id">
              {{ group.name }} ({{ group.age_range }}) - {{ group.capacityInfo }}
            </option>
          </select>
        </div>

        <!-- Show suggestions -->
        <div v-if="!form.new_group_id && suggestions.length > 0" class="mb-4 p-3 bg-blue-50 rounded-md">
          <p class="text-sm font-medium text-blue-900 mb-2">Suggested Groups:</p>
          <div class="space-y-1">
            <button
              v-for="suggestion in suggestions.slice(0, 3)"
              :key="suggestion.group.id"
              type="button"
              @click="form.new_group_id = suggestion.group.id; onGroupChange()"
              :class="[
                'text-left w-full px-3 py-2 text-sm rounded-md border transition-colors',
                suggestion.match === 'perfect' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                suggestion.match === 'good' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                'bg-gray-50 border-gray-200 hover:bg-gray-100'
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ suggestion.group.name }} ({{ suggestion.group.age_range }})</span>
                <span class="text-xs text-gray-600">{{ suggestion.reason }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Show capacity warning for selected group -->
        <div v-if="form.new_group_id && selectedGroupCapacity" class="mb-4">
          <GroupCapacityIndicator
            :current="selectedGroupCapacity.current"
            :max="selectedGroupCapacity.max"
          />
          <p v-if="selectedGroupCapacity.warning" class="text-xs text-orange-600 mt-1">
            {{ selectedGroupCapacity.warning }}
          </p>
        </div>

        <!-- Show teachers for selected group -->
        <div v-if="form.new_group_id && selectedGroupTeachers.length > 0" class="mb-4 p-2 bg-gray-50 rounded-md">
          <p class="text-xs font-medium text-gray-700 mb-1">Teachers in New Group:</p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="teacher in selectedGroupTeachers"
              :key="teacher.id"
              class="text-xs px-2 py-0.5 bg-white rounded border border-gray-200"
            >
              {{ teacher.full_name }} ({{ teacher.role === 'primary' ? 'Primary' : teacher.role }})
            </span>
          </div>
        </div>

        <!-- Transfer Date -->
        <div class="mb-4">
          <label for="transfer_date" class="block text-sm font-medium text-gray-700 mb-2">
            Transfer Date <span class="text-red-500">*</span>
          </label>
          <input
            id="transfer_date"
            v-model="form.transfer_date"
            type="date"
            required
            :min="new Date().toISOString().split('T')[0]"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Notes -->
        <div class="mb-4">
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Reason for group change, special instructions, etc."
          />
        </div>

        <!-- Validation Errors -->
        <div v-if="validationErrors.length > 0" class="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          <ul class="list-disc list-inside space-y-1">
            <li v-for="err in validationErrors" :key="err">{{ err }}</li>
          </ul>
        </div>

        <!-- Warnings -->
        <div v-if="validationWarnings.length > 0" class="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
          <ul class="list-disc list-inside space-y-1">
            <li v-for="warn in validationWarnings" :key="warn">{{ warn }}</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-end pt-4">
          <button
            type="button"
            @click="$router.push(`/admin/children/${childId}`)"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="submitting || !form.new_group_id || !form.transfer_date"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Transferring...' : 'Transfer to New Group' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useChildrenStore } from '~/stores/children'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import GroupCapacityIndicator from '~/components/groups/GroupCapacityIndicator.vue'
import { suggestGroupsForChild, validateGroupAssignment, checkGroupCapacity } from '~/utils/groupAssignment'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const childrenStore = useChildrenStore()
const groupsStore = useGroupsStore()

const childId = route.params.id as string
const child = ref<any>(null)
const currentGroup = ref<any>(null)
const currentGroupTeachers = ref<any[]>([])
const availableGroups = ref<any[]>([])
const groupCapacities = ref<Record<string, { current: number; max: number; available: number }>>({})
const selectedGroupCapacity = ref<{ current: number; max: number; available: number; warning: string | null } | null>(null)
const selectedGroupTeachers = ref<any[]>([])
const suggestions = ref<Array<{ group: any; match: string; reason: string }>>([])
const validationErrors = ref<string[]>([])
const validationWarnings = ref<string[]>([])

const loading = ref(true)
const submitting = ref(false)
const error = ref('')

const form = ref({
  new_group_id: '',
  transfer_date: new Date().toISOString().split('T')[0],
  notes: ''
})

onMounted(async () => {
  try {
    // Load child
    const childData = await childrenStore.fetchChildById(childId)
    if (!childData) {
      error.value = 'Child not found'
      return
    }
    child.value = childData

    // Load current group if assigned
    if (childData.group_id) {
      currentGroup.value = await groupsStore.fetchGroupById(childData.group_id)
      const teachers = await groupsStore.fetchGroupTeachers(childData.group_id)
      currentGroupTeachers.value = teachers || []
    }

    // Load all groups
    await groupsStore.fetchGroups()
    const groupsArray = Array.isArray(groupsStore.groups) ? groupsStore.groups : []
    availableGroups.value = groupsArray.filter(g => g.id !== childData.group_id)

    // Load capacities
    for (const group of availableGroups.value) {
      const capacity = await groupsStore.getGroupCapacity(group.id)
      groupCapacities.value[group.id] = capacity
    }

    // Generate suggestions
    if (childData.date_of_birth) {
      const childrenCounts: Record<string, number> = {}
      for (const group of availableGroups.value) {
        childrenCounts[group.id] = groupCapacities.value[group.id]?.current || 0
      }
      suggestions.value = suggestGroupsForChild(
        { date_of_birth: childData.date_of_birth },
        availableGroups.value,
        childrenCounts
      )
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
})

const onGroupChange = async () => {
  validationErrors.value = []
  validationWarnings.value = []

  if (!form.value.new_group_id) {
    selectedGroupCapacity.value = null
    selectedGroupTeachers.value = []
    return
  }

  // Load selected group data
  const selectedGroup = availableGroups.value.find(g => g.id === form.value.new_group_id)
  if (!selectedGroup) return

  // Load capacity
  const capacity = groupCapacities.value[selectedGroup.id] || await groupsStore.getGroupCapacity(selectedGroup.id)
  const capacityCheck = checkGroupCapacity(selectedGroup.id, capacity.current, capacity.max)
  selectedGroupCapacity.value = {
    ...capacity,
    warning: capacityCheck.warning
  }

  // Load teachers
  const teachers = await groupsStore.fetchGroupTeachers(selectedGroup.id)
  selectedGroupTeachers.value = teachers || []

  // Validate assignment
  if (child.value && child.value.date_of_birth) {
    const validation = validateGroupAssignment(
      child.value,
      selectedGroup,
      capacity.current
    )
    validationErrors.value = validation.errors
    validationWarnings.value = validation.warnings
  }
}

const handleSubmit = async () => {
  if (!form.value.new_group_id || !form.value.transfer_date) {
    validationErrors.value = ['Please select a group and transfer date']
    return
  }

  // Re-validate
  const selectedGroup = availableGroups.value.find(g => g.id === form.value.new_group_id)
  if (selectedGroup && child.value) {
    const capacity = groupCapacities.value[selectedGroup.id] || await groupsStore.getGroupCapacity(selectedGroup.id)
    const validation = validateGroupAssignment(
      child.value,
      selectedGroup,
      capacity.current
    )
    
    if (!validation.valid) {
      validationErrors.value = validation.errors
      return
    }
  }

  submitting.value = true
  validationErrors.value = []

  try {
    // Update child's group
    const { error: updateError } = await supabase
      .from('children')
      .update({ group_id: form.value.new_group_id })
      .eq('id', childId)

    if (updateError) throw updateError

    alert('Child successfully transferred to new group!')
    router.push(`/admin/children/${childId}`)
  } catch (e: any) {
    validationErrors.value = [e.message || 'Failed to transfer child']
  } finally {
    submitting.value = false
  }
}
</script>
