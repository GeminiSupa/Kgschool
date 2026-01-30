<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/hr/payroll"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Payroll
      </NuxtLink>
      <Heading size="xl">Generate Monthly Payroll</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <form @submit.prevent="generatePayroll" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="month" class="block text-sm font-medium text-gray-700 mb-2">
              Month <span class="text-red-500">*</span>
            </label>
            <select
              id="month"
              v-model.number="form.month"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="m in 12" :key="m" :value="m">
                {{ getMonthName(m) }}
              </option>
            </select>
          </div>

          <div>
            <label for="year" class="block text-sm font-medium text-gray-700 mb-2">
              Year <span class="text-red-500">*</span>
            </label>
            <input
              id="year"
              v-model.number="form.year"
              type="number"
              required
              :min="2020"
              :max="2100"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div v-if="preview" class="p-4 bg-gray-50 rounded-md space-y-2">
          <h3 class="font-medium mb-2">Preview</h3>
          <p class="text-sm text-gray-600">
            This will generate payroll for <strong>{{ preview.staffCount }}</strong> staff members.
          </p>
          <p class="text-sm text-gray-600">
            Total estimated payroll: <strong>€{{ preview.totalAmount.toFixed(2) }}</strong>
          </p>
        </div>

        <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ error }}
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <button
            type="button"
            @click="handleCancel"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="loadPreview"
            :disabled="generating"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Preview
          </button>
          <button
            type="submit"
            :disabled="generating || !preview"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ generating ? 'Generating...' : 'Generate Payroll' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { usePayrollStore } from '~/stores/payroll'
import { useSalaryConfigStore } from '~/stores/salaryConfig'
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const supabase = useSupabaseClient()
const payrollStore = usePayrollStore()
const salaryConfigStore = useSalaryConfigStore()

const generating = ref(false)
const error = ref('')
const preview = ref<any>(null)

const form = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear()
})

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const loadPreview = async () => {
  try {
    error.value = ''
    const { data: staff } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['teacher', 'support', 'kitchen'])

    if (!staff) {
      preview.value = { staffCount: 0, totalAmount: 0 }
      return
    }

    let totalAmount = 0
    for (const s of staff) {
      const config = await salaryConfigStore.getCurrentConfig(s.id)
      if (config) {
        totalAmount += config.base_salary || 0
      }
    }

    preview.value = {
      staffCount: staff.length,
      totalAmount
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load preview'
    preview.value = null
  }
}

const generatePayroll = async () => {
  if (!preview.value) {
    error.value = 'Please preview first'
    return
  }

  generating.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/admin/hr/payroll/generate', {
      method: 'POST',
      body: {
        month: form.value.month,
        year: form.value.year
      }
    })

    if (response.success) {
      alert(`Payroll generated successfully for ${response.count} staff members!`)
      router.push('/admin/hr/payroll')
    } else {
      throw new Error(response.message || 'Failed to generate payroll')
    }
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to generate payroll'
  } finally {
    generating.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/hr/payroll')
}
</script>
