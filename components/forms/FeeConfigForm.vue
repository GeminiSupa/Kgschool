<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="fee_type" class="block text-sm font-medium text-gray-700 mb-2">
        Fee Type <span class="text-red-500">*</span>
      </label>
      <select
        id="fee_type"
        v-model="form.fee_type"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="tuition">Tuition</option>
        <option value="lunch">Lunch</option>
        <option value="activities">Activities</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div>
      <label for="group_id" class="block text-sm font-medium text-gray-700 mb-2">
        Group (Optional - leave empty for all groups)
      </label>
      <select
        id="group_id"
        v-model="form.group_id"
        :disabled="groupsLoading"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="">{{ groupsLoading ? 'Loading...' : 'All Groups' }}</option>
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
    </div>

    <div>
      <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
        Amount (€) <span class="text-red-500">*</span>
      </label>
      <input
        id="amount"
        v-model.number="form.amount"
        type="number"
        step="0.01"
        required
        min="0"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
          :min="form.effective_from"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div>
      <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
        Notes
      </label>
      <textarea
        id="notes"
        v-model="form.notes"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Additional notes about this fee configuration..."
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
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Saving...' : 'Save Configuration' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useGroupsStore } from '~/stores/groups'
import type { FeeConfig } from '~/stores/feeConfig'

interface Props {
  initialData?: FeeConfig
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined
})

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}>()

const groupsStore = useGroupsStore()
const { groups, loading: groupsLoading } = storeToRefs(groupsStore)

const loading = ref(false)
const error = ref('')

const form = ref({
  fee_type: props.initialData?.fee_type || 'tuition',
  group_id: props.initialData?.group_id || '',
  amount: props.initialData?.amount || 0,
  effective_from: props.initialData?.effective_from || new Date().toISOString().split('T')[0],
  effective_to: props.initialData?.effective_to || undefined,
  notes: props.initialData?.notes || ''
})

onMounted(async () => {
  await groupsStore.fetchGroups()
})

const handleSubmit = () => {
  loading.value = true
  error.value = ''

  const submitData: any = {
    ...form.value
  }

  if (!submitData.group_id) {
    delete submitData.group_id
  }

  if (!submitData.effective_to) {
    delete submitData.effective_to
  }

  emit('submit', submitData)
}
</script>
