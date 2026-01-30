<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/billing"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Billing
      </NuxtLink>
      <Heading size="xl">Process Refunds</Heading>
    </div>

    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <p class="text-gray-600 mb-4">
        Refundable items are informed absences from previous months that were notified before the deadline.
      </p>
      <button
        @click="loadRefundableItems"
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {{ loading ? 'Loading...' : 'Load Refundable Items' }}
      </button>
    </div>

    <div v-if="itemsLoading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="refundableItems.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
      No refundable items found.
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="p-4 bg-gray-50 border-b flex items-center justify-between">
        <div>
          <p class="font-medium">Total Refundable Amount: €{{ totalRefundAmount.toFixed(2) }}</p>
          <p class="text-sm text-gray-600">{{ refundableItems.length }} items</p>
        </div>
        <button
          @click="processAllRefunds"
          :disabled="processing"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {{ processing ? 'Processing...' : 'Process All Refunds' }}
        </button>
      </div>

      <div class="divide-y divide-gray-200">
        <div
          v-for="item in refundableItems"
          :key="item.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="font-medium text-gray-900">
                {{ getChildName(item.child_id) }}
              </p>
              <p class="text-sm text-gray-600 mt-1">
                Date: {{ formatDate(item.date) }} | Amount: €{{ item.meal_price.toFixed(2) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Billing: {{ getMonthName(item.billing_month) }} {{ item.billing_year }}
              </p>
            </div>
            <div>
              <button
                v-if="!item.refunded"
                @click="processRefund(item.id)"
                :disabled="processing"
                class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Process Refund
              </button>
              <span
                v-else
                class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md"
              >
                Refunded
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const supabase = useSupabaseClient()
const childrenStore = useChildrenStore()

const { children } = storeToRefs(childrenStore)

const loading = ref(false)
const itemsLoading = ref(false)
const processing = ref(false)
const refundableItems = ref<any[]>([])

onMounted(async () => {
  await childrenStore.fetchChildren()
})

const loadRefundableItems = async () => {
  itemsLoading.value = true
  try {
    // Get all refundable items that haven't been refunded yet
    const { data, error } = await supabase
      .from('lunch_billing_items')
      .select(`
        *,
        monthly_billing!inner(month, year, child_id)
      `)
      .eq('is_refundable', true)
      .eq('refunded', false)
      .order('date', { ascending: false })

    if (error) throw error

    // Transform data to include billing info
    refundableItems.value = (data || []).map(item => ({
      ...item,
      child_id: item.monthly_billing.child_id,
      billing_month: item.monthly_billing.month,
      billing_year: item.monthly_billing.year
    }))
  } catch (e: any) {
    alert(e.message || 'Failed to load refundable items')
  } finally {
    itemsLoading.value = false
  }
}

const totalRefundAmount = computed(() => {
  return refundableItems.value
    .filter(item => !item.refunded)
    .reduce((sum, item) => sum + item.meal_price, 0)
})

const processRefund = async (itemId: string) => {
  if (!confirm('Process refund for this item?')) return

  processing.value = true
  try {
    const response = await $fetch('/api/admin/lunch/billing/process-refunds', {
      method: 'POST',
      body: { item_ids: [itemId] }
    })

    if (response.success) {
      alert('Refund processed successfully!')
      await loadRefundableItems()
    }
  } catch (e: any) {
    alert(e.data?.message || e.message || 'Failed to process refund')
  } finally {
    processing.value = false
  }
}

const processAllRefunds = async () => {
  if (!confirm(`Process refunds for all ${refundableItems.value.length} items?`)) return

  processing.value = true
  try {
    const itemIds = refundableItems.value
      .filter(item => !item.refunded)
      .map(item => item.id)

    const response = await $fetch('/api/admin/lunch/billing/process-refunds', {
      method: 'POST',
      body: { item_ids: itemIds }
    })

    if (response.success) {
      alert(`Successfully processed ${response.count} refunds!`)
      await loadRefundableItems()
    }
  } catch (e: any) {
    alert(e.data?.message || e.message || 'Failed to process refunds')
  } finally {
    processing.value = false
  }
}

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleString('default', { month: 'long' })
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
