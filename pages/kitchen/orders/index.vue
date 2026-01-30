<template>
  <div>
    <Heading size="xl" class="mb-6">Lunch Orders</Heading>

    <div class="mb-4">
      <input
        v-model="selectedDate"
        type="date"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchOrders"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="orders.length === 0" class="p-8 text-center text-gray-500">
        No orders for this date.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="order in orders"
          :key="order.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900">{{ getChildName(order.child_id) }}</p>
                <span
                  v-if="order.auto_created"
                  class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full"
                >
                  Auto-created
                </span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ getMenuName(order.menu_id) }}</p>
              <p class="text-xs text-gray-500 mt-2">Order Date: {{ formatDate(order.order_date) }}</p>
              <p v-if="order.status === 'cancelled'" class="text-xs text-red-600 mt-1">
                Cancelled
              </p>
            </div>
            <div class="flex items-center gap-4">
              <span
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-full',
                  order.status === 'served' ? 'bg-green-100 text-green-800' :
                  order.status === 'prepared' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                ]"
              >
                {{ order.status }}
              </span>
              <div class="flex gap-2">
                <button
                  v-if="order.status === 'confirmed' && order.status !== 'cancelled'"
                  @click="updateOrderStatus(order.id, 'prepared')"
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Mark Prepared
                </button>
                <button
                  v-if="order.status === 'prepared' && order.status !== 'cancelled'"
                  @click="updateOrderStatus(order.id, 'served')"
                  class="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Mark Served
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useLunchStore } from '~/stores/lunch'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'kitchen'
})

const supabase = useSupabaseClient()
const lunchStore = useLunchStore()
const childrenStore = useChildrenStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(true)
const error = ref('')
const orders = ref<any[]>([])
const children = ref<any[]>([])

onMounted(async () => {
  await Promise.all([
    childrenStore.fetchChildren(),
    lunchStore.fetchMenus()
  ])
  children.value = childrenStore.children
  await fetchOrders()
})

const fetchOrders = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Fetch orders for the selected date
    const { data, error: err } = await supabase
      .from('lunch_orders')
      .select('*')
      .eq('order_date', selectedDate.value)
      .order('created_at', { ascending: true })

    if (err) throw err
    orders.value = data || []
  } catch (e: any) {
    error.value = e.message || 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const { error: err } = await supabase
      .from('lunch_orders')
      .update({ status })
      .eq('id', orderId)

    if (err) throw err

    // Update local state
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = status
    }
  } catch (e: any) {
    alert(e.message || 'Failed to update order status')
  }
}

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const getMenuName = (menuId: string) => {
  const menu = lunchStore.menus.find(m => m.id === menuId)
  return menu ? menu.meal_name : menuId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
