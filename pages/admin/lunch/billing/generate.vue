<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/billing"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Billing
      </NuxtLink>
      <Heading size="xl">Generate Monthly Billing</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 max-w-2xl">
      <form @submit.prevent="handleGenerate" class="space-y-4">
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
              :min="new Date().getFullYear() - 1"
              :max="new Date().getFullYear() + 1"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <button
            type="button"
            @click="loadDetailedPreview"
            :disabled="loadingPreview || !isFormValid"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loadingPreview ? 'Loading Preview...' : '📊 Load Detailed Preview' }}
          </button>
        </div>

        <div v-if="loadingPreview" class="p-4 bg-blue-50 rounded-md">
          <p class="text-sm text-blue-700">Loading preview data...</p>
        </div>

        <div v-else-if="detailedPreview" class="space-y-4">
          <!-- Summary -->
          <div class="p-4 bg-gray-50 rounded-md">
            <h3 class="font-medium mb-3">Summary</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-gray-600">Total Children</p>
                <p class="text-lg font-semibold">{{ detailedPreview.totalChildren }}</p>
              </div>
              <div>
                <p class="text-gray-600">Billable Days</p>
                <p class="text-lg font-semibold">{{ detailedPreview.summary.totalBillableDays }}</p>
              </div>
              <div>
                <p class="text-gray-600">Estimated Total</p>
                <p class="text-lg font-semibold text-green-600">€{{ detailedPreview.summary.estimatedTotal.toFixed(2) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Estimated Refund</p>
                <p class="text-lg font-semibold text-blue-600">€{{ detailedPreview.summary.estimatedRefund.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Children Preview (Collapsible) -->
          <div class="border border-gray-200 rounded-md">
            <button
              type="button"
              @click="showChildrenPreview = !showChildrenPreview"
              class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between rounded-t-md"
            >
              <span class="font-medium">Children Breakdown ({{ detailedPreview.children.length }})</span>
              <span>{{ showChildrenPreview ? '▼' : '▶' }}</span>
            </button>
            <div v-if="showChildrenPreview" class="max-h-96 overflow-y-auto divide-y divide-gray-200">
              <div
                v-for="child in detailedPreview.children"
                :key="child.childId"
                class="p-4 hover:bg-gray-50"
              >
                <div class="flex items-center justify-between mb-2">
                  <p class="font-medium">{{ child.childName }}</p>
                  <div class="text-sm text-gray-600">
                    <span class="text-green-600">€{{ child.estimatedAmount.toFixed(2) }}</span>
                    <span v-if="child.estimatedRefund > 0" class="ml-2 text-blue-600">
                      (Refund: €{{ child.estimatedRefund.toFixed(2) }})
                    </span>
                  </div>
                </div>
                <div class="text-xs text-gray-500">
                  Billable: {{ child.billableDays }} days | Refundable: {{ child.refundableDays }} days
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="preview" class="p-4 bg-gray-50 rounded-md space-y-2">
          <h3 class="font-medium mb-2">Basic Preview</h3>
          <p class="text-sm text-gray-600">
            This will generate billing for all active children for <strong>{{ getMonthName(form.month) }} {{ form.year }}</strong>.
          </p>
          <p class="text-sm text-gray-600">
            Estimated children: <strong>{{ preview.estimatedChildren }}</strong>
          </p>
          <div v-if="preview.hasPricing === false" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p class="text-sm text-yellow-800">
              ⚠️ <strong>Warning:</strong> Some groups don't have lunch pricing set up. 
              Bills for those groups will show €0.00.
            </p>
            <NuxtLink
              to="/admin/lunch/pricing"
              class="text-sm text-yellow-800 underline hover:text-yellow-900 mt-1 inline-block"
            >
              Set up pricing →
            </NuxtLink>
          </div>
          <div v-else-if="preview.hasPricing" class="mt-2 text-sm text-green-700">
            ✓ Lunch pricing is configured
          </div>
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
            :disabled="loading || !isFormValid"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Generating...' : 'Generate Billing' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const router = useRouter()
const supabase = useSupabaseClient()
const { getUserKitaId } = useKita()

const loading = ref(false)
const loadingPreview = ref(false)
const error = ref('')
const preview = ref<any>(null)
const detailedPreview = ref<any>(null)
const showChildrenPreview = ref(false)

const form = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear()
})

const isFormValid = computed(() => {
  return form.value.month >= 1 && form.value.month <= 12 && form.value.year
})

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

onMounted(async () => {
  await loadPreview()
})

const loadPreview = async () => {
  try {
    const kitaId = await getUserKitaId()
    
    let childrenQuery = supabase
      .from('children')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    if (kitaId) {
      childrenQuery = childrenQuery.eq('kita_id', kitaId)
    }
    
    const { count } = await childrenQuery

    // Check if pricing is set up (filtered by kita via groups)
    let pricingQuery = supabase
      .from('lunch_pricing')
      .select('id')
      .limit(1)
    
    // Note: lunch_pricing doesn't have kita_id directly, but groups do
    // For now, just check if any pricing exists
    const { data: pricingData } = await pricingQuery.single()

    let groupsQuery = supabase
      .from('groups')
      .select('id, lunch_price_per_meal')
      .not('lunch_price_per_meal', 'is', null)
      .limit(1)
    
    if (kitaId) {
      groupsQuery = groupsQuery.eq('kita_id', kitaId)
    }
    
    const { data: groupsData } = await groupsQuery.single()

    const hasPricing = !!(pricingData || groupsData)

    preview.value = {
      estimatedChildren: count || 0,
      hasPricing
    }
  } catch (e: any) {
    console.error('Error loading preview:', e)
    preview.value = {
      estimatedChildren: 0,
      hasPricing: false
    }
  }
}

const loadDetailedPreview = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in month and year first'
    return
  }

  loadingPreview.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/admin/lunch/billing/preview', {
      method: 'GET',
      params: {
        month: form.value.month,
        year: form.value.year
      }
    })

    if (response.success && response.preview) {
      detailedPreview.value = response.preview
      showChildrenPreview.value = false
    }
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to load preview'
    console.error('Error loading detailed preview:', e)
  } finally {
    loadingPreview.value = false
  }
}

watch([() => form.value.month, () => form.value.year], () => {
  detailedPreview.value = null
  showChildrenPreview.value = false
})

const handleGenerate = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/admin/lunch/billing/generate', {
      method: 'POST',
      body: {
        month: form.value.month,
        year: form.value.year
      }
    })

    if (response.success) {
      alert(`Successfully generated ${response.count} billing records!`)
      router.push('/admin/lunch/billing')
    }
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Failed to generate billing'
  } finally {
    loading.value = false
  }
}
</script>
