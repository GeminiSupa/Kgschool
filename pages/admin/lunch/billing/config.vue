<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/billing"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Billing
      </NuxtLink>
      <Heading size="xl">Billing Configuration</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="deadline_hours" class="block text-sm font-medium text-gray-700 mb-2">
            Informed Absence Deadline (Hours)
          </label>
          <input
            id="deadline_hours"
            v-model.number="form.deadline_hours"
            type="number"
            min="1"
            max="48"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Number of hours before 8 AM on the absence date that parents must notify.
            For example, 16 hours means parents must notify by 4 PM the day before.
          </p>
        </div>

        <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <NuxtLink
            to="/admin/lunch/billing"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Saving...' : 'Save Configuration' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const loading = ref(false)
const error = ref('')
const form = ref({
  deadline_hours: 16
})

onMounted(async () => {
  try {
    const { data, error: err } = await supabase
      .from('billing_config')
      .select('*')
      .eq('key', 'informed_absence_deadline_hours')
      .single()

    if (err && err.code !== 'PGRST116') throw err
    
    if (data) {
      form.value.deadline_hours = parseInt(data.value) || 16
    }
  } catch (e: any) {
    console.error('Error loading config:', e)
  }
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const { error: err } = await supabase
      .from('billing_config')
      .upsert({
        key: 'informed_absence_deadline_hours',
        value: form.value.deadline_hours.toString(),
        description: 'Hours before 8 AM on absence date that parent must notify'
      })

    if (err) throw err

    alert('Configuration saved successfully!')
  } catch (e: any) {
    error.value = e.message || 'Failed to save configuration'
  } finally {
    loading.value = false
  }
}
</script>
