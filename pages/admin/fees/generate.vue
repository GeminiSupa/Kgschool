<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/fees"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Fees
      </NuxtLink>
      <Heading size="xl">Generate Monthly Fees</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <form @submit.prevent="generateFees" class="space-y-4">
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

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fee Types to Generate
          </label>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input
                v-model="form.feeTypes"
                type="checkbox"
                value="tuition"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Tuition</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="form.feeTypes"
                type="checkbox"
                value="activities"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Activities</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="form.feeTypes"
                type="checkbox"
                value="other"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Other</span>
            </label>
            <p class="text-xs text-gray-500 mt-2">
              Note: Lunch fees are managed separately in the lunch billing system.
            </p>
          </div>
        </div>

        <div v-if="preview" class="p-4 bg-gray-50 rounded-md space-y-2">
          <h3 class="font-medium mb-2">Preview</h3>
          <p class="text-sm text-gray-600">
            This will generate fees for <strong>{{ preview.childrenCount }}</strong> active children.
          </p>
          <p class="text-sm text-gray-600">
            Estimated total: <strong>€{{ preview.totalAmount.toFixed(2) }}</strong>
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
            :disabled="generating || !preview || form.feeTypes.length === 0"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ generating ? 'Generating...' : 'Generate Fees' }}
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
import { useFeeConfigStore } from '~/stores/feeConfig'
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const supabase = useSupabaseClient()
const feeConfigStore = useFeeConfigStore()

const generating = ref(false)
const error = ref('')
const preview = ref<any>(null)

const form = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  feeTypes: [] as string[]
})

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const loadPreview = async () => {
  try {
    error.value = ''
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, group_id')
      .eq('status', 'active')

    if (childrenError) throw childrenError

    let totalAmount = 0
    for (const child of children || []) {
      if (!child.group_id) continue

      for (const feeType of form.value.feeTypes) {
        const config = await feeConfigStore.getCurrentConfig(child.group_id, feeType)
        if (config) {
          totalAmount += config.amount || 0
        }
      }
    }

    preview.value = {
      childrenCount: children?.length || 0,
      totalAmount
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load preview'
    preview.value = null
  }
}

const generateFees = async () => {
  if (!preview.value || form.value.feeTypes.length === 0) {
    error.value = 'Please preview first and select at least one fee type'
    return
  }

  generating.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/admin/fees/generate', {
      method: 'POST',
      body: {
        month: form.value.month,
        year: form.value.year,
        fee_types: form.value.feeTypes
      }
    })

    if (response.success) {
      alert(`Fees generated successfully for ${response.count} children!`)
      router.push('/admin/fees')
    } else {
      throw new Error(response.message || 'Failed to generate fees')
    }
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to generate fees'
  } finally {
    generating.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/fees')
}
</script>
