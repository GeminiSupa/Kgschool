<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/parent-work"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Parent Work Tasks
      </NuxtLink>
      <Heading size="xl">Create New Parent Work Task</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <form @submit.prevent="handleSubmit" class="space-y-4">
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
            placeholder="e.g., Kitchen Cleaning"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the task in detail..."
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="task_type" class="block text-sm font-medium text-gray-700 mb-2">
              Task Type <span class="text-red-500">*</span>
            </label>
            <select
              id="task_type"
              v-model="form.task_type"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="cleaning">Cleaning</option>
              <option value="cooking">Cooking</option>
              <option value="maintenance">Maintenance</option>
              <option value="gardening">Gardening</option>
              <option value="administration">Administration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label for="hourly_rate" class="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate (€) <span class="text-red-500">*</span>
            </label>
            <input
              id="hourly_rate"
              v-model.number="form.hourly_rate"
              type="number"
              step="0.01"
              min="0"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="estimated_hours" class="block text-sm font-medium text-gray-700 mb-2">
              Estimated Hours
            </label>
            <input
              id="estimated_hours"
              v-model.number="form.estimated_hours"
              type="number"
              step="0.5"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="due_date" class="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              id="due_date"
              v-model="form.due_date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label for="assigned_to" class="block text-sm font-medium text-gray-700 mb-2">
            Assign To (Optional)
          </label>
          <select
            id="assigned_to"
            v-model="form.assigned_to"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            <option v-for="parent in parents" :key="parent.id" :value="parent.id">
              {{ parent.full_name }}
            </option>
          </select>
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
            placeholder="Additional notes..."
          />
        </div>

        <div v-if="submitError" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ submitError }}
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <NuxtLink
            to="/admin/parent-work"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ loading ? 'Creating...' : 'Create Task' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useParentWorkStore } from '~/stores/parentWork'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const parentWorkStore = useParentWorkStore()
const { getUserKitaId } = useKita()
const loading = ref(false)
const submitError = ref('')
const parents = ref<any[]>([])

const form = ref({
  title: '',
  description: '',
  task_type: 'cleaning' as const,
  hourly_rate: 0,
  estimated_hours: undefined as number | undefined,
  due_date: '',
  assigned_to: '',
  notes: ''
})

onMounted(async () => {
  await loadParents()
})

const loadParents = async () => {
  try {
    const supabase = useSupabaseClient()
    const kitaId = await getUserKitaId()
    
    // Get parents who belong to this kita
    if (kitaId) {
      const { data: membersData } = await supabase
        .from('organization_members')
        .select('profile_id, profiles(*)')
        .eq('kita_id', kitaId)
      
      if (membersData) {
        parents.value = membersData
          .map((item: any) => item.profiles)
          .filter((profile: any) => profile && profile.role === 'parent')
          .sort((a: any, b: any) => (a.full_name || '').localeCompare(b.full_name || ''))
      }
    } else {
      // Fallback: load all parents
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'parent')
        .order('full_name')

      parents.value = data || []
    }
  } catch (e: any) {
    console.error('Error loading parents:', e)
  }
}

const handleSubmit = async () => {
  loading.value = true
  submitError.value = ''

  try {
    const taskData: any = {
      ...form.value,
      status: form.value.assigned_to ? 'assigned' : 'open',
      assigned_date: form.value.assigned_to ? new Date().toISOString().split('T')[0] : undefined
    }

    if (!taskData.assigned_to) {
      delete taskData.assigned_to
    }

    if (!taskData.due_date) {
      delete taskData.due_date
    }

    if (!taskData.estimated_hours) {
      delete taskData.estimated_hours
    }

    await parentWorkStore.createTask(taskData)
    router.push('/admin/parent-work')
  } catch (e: any) {
    submitError.value = e.message || 'Failed to create task'
  } finally {
    loading.value = false
  }
}
</script>
