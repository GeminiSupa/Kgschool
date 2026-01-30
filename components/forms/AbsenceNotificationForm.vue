<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label for="child_id" class="block text-sm font-medium text-gray-700 mb-2">
        Child <span class="text-red-500">*</span>
      </label>
      <select
        id="child_id"
        v-model="form.child_id"
        required
        :disabled="childrenLoading"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{{ childrenLoading ? 'Loading children...' : 'Select a child' }}</option>
        <option v-for="child in children" :key="child.id" :value="child.id">
          {{ child.first_name }} {{ child.last_name }}
        </option>
      </select>
    </div>

    <div>
      <label for="absence_date" class="block text-sm font-medium text-gray-700 mb-2">
        Absence Date <span class="text-red-500">*</span>
      </label>
      <input
        id="absence_date"
        v-model="form.absence_date"
        type="date"
        :min="minDate"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      />
      <p class="text-xs text-gray-500 mt-1">
        Select the date your child will be absent
      </p>
    </div>

    <div>
      <label for="notification_method" class="block text-sm font-medium text-gray-700 mb-2">
        Notification Method
      </label>
      <select
        id="notification_method"
        v-model="form.notification_method"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="app">App</option>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
      </select>
    </div>

    <div>
      <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
        Notes (Optional)
      </label>
      <textarea
        id="notes"
        v-model="form.notes"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Additional information about the absence..."
      />
    </div>

    <div v-if="deadlineInfo" class="p-3 rounded-md text-sm" :class="deadlineInfo.met ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'">
      <p>
        {{ deadlineInfo.met 
          ? '✓ Deadline met! This absence will be refunded.' 
          : '⚠ Deadline may not be met. Please notify as early as possible.' }}
      </p>
      <p class="text-xs mt-1">{{ deadlineInfo.message }}</p>
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
        {{ loading ? 'Submitting...' : 'Notify Absence' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useChildrenStore } from '~/stores/children'
import { useAuthStore } from '~/stores/auth'

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const supabase = useSupabaseClient()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()

const { children, loading: childrenLoading } = storeToRefs(childrenStore)

const loading = ref(false)
const error = ref('')
const deadlineInfo = ref<{ met: boolean; message: string } | null>(null)

const form = ref({
  child_id: '',
  absence_date: '',
  notification_method: 'app' as 'app' | 'email' | 'phone',
  notes: ''
})

const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return form.value.child_id && form.value.absence_date
})

onMounted(async () => {
  await childrenStore.fetchChildren()
  // Filter to only show parent's children
  if (authStore.profile?.role === 'parent') {
    // Children store should already filter by parent_ids via RLS
  }
})

watch([() => form.value.absence_date, () => form.value.child_id], async ([date, childId]) => {
  if (date && childId) {
    await checkDeadline(date)
  }
})

const checkDeadline = async (absenceDate: string) => {
  try {
    const { data, error: err } = await supabase
      .rpc('check_informed_absence_deadline', {
        p_absence_date: absenceDate,
        p_notification_time: new Date().toISOString()
      })

    if (err) throw err

    const { data: configData } = await supabase
      .from('billing_config')
      .select('value')
      .eq('key', 'informed_absence_deadline_hours')
      .single()

    const deadlineHours = parseInt(configData?.value || '16')
    const absenceDateObj = new Date(absenceDate)
    const deadlineTime = new Date(absenceDateObj)
    deadlineTime.setHours(8 - deadlineHours, 0, 0, 0)

    deadlineInfo.value = {
      met: data || false,
      message: `Deadline: ${deadlineTime.toLocaleString()} (${deadlineHours} hours before 8 AM on ${absenceDate})`
    }
  } catch (e: any) {
    console.error('Error checking deadline:', e)
  }
}

const handleSubmit = () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''

  emit('submit', {
    ...form.value,
    notified_by: authStore.user?.id
  })
}
</script>
