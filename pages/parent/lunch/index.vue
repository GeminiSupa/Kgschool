<template>
  <div>
    <Heading size="xl" class="mb-6">Lunch Orders</Heading>

    <!-- Deadline Warning for Today's Orders -->
    <div v-if="todayOrder" class="mb-6">
      <OrderDeadlineWarning :order-date="todayOrder.order_date" />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else>
      <div class="mb-6">
        <label for="child" class="block text-sm font-medium text-gray-700 mb-2">
          Select Child
        </label>
        <select
          id="child"
          v-model="selectedChildId"
          class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a child</option>
          <option v-for="child in myChildren" :key="child.id" :value="child.id">
            {{ child.first_name }} {{ child.last_name }}
          </option>
        </select>
      </div>

      <div v-if="upcomingMenus.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No upcoming menus available.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="menu in upcomingMenus"
          :key="menu.id"
          class="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <p class="text-lg font-medium text-gray-900 mb-2">{{ menu.meal_name }}</p>
          <p class="text-sm text-gray-600 mb-3">{{ menu.description }}</p>
          <p class="text-xs text-gray-500 mb-3">Date: {{ formatDate(menu.date) }}</p>
          
          <div v-if="menu.allergens && menu.allergens.length > 0" class="mb-3">
            <p class="text-xs text-orange-600">
              Allergens: {{ menu.allergens.join(', ') }}
            </p>
          </div>

          <div v-if="selectedChildId" class="space-y-2">
            <button
              v-if="!hasOrdered(menu.id)"
              @click="placeOrder(menu.id)"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Order This Meal
            </button>
            <div v-else class="space-y-2">
              <p class="text-sm text-center text-gray-600">Ordered</p>
              <button
                v-if="canCancelOrder(menu.id)"
                @click="cancelOrderForMenu(menu.id)"
                class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
              <p v-else-if="isTodayMenu(menu.id)" class="text-xs text-center text-red-600">
                Cannot cancel after 8 AM
              </p>
            </div>
          </div>
          <p v-else class="text-sm text-gray-500 text-center">
            Select a child to place order
          </p>
        </div>
      </div>

      <div v-if="myOrders.length > 0" class="mt-8">
        <Heading size="md" class="mb-4">My Orders</Heading>
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="divide-y divide-gray-200">
            <div
              v-for="order in myOrders"
              :key="order.id"
              class="p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-medium">{{ getMenuName(order.menu_id) }}</p>
                    <span
                      v-if="order.auto_created"
                      class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full"
                    >
                      Auto-created
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">Date: {{ formatDate(order.order_date) }}</p>
                  <p v-if="order.status === 'cancelled'" class="text-xs text-red-600 mt-1">
                    Cancelled
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      order.status === 'served' ? 'bg-green-100 text-green-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    ]"
                  >
                    {{ order.status }}
                  </span>
                  <button
                    v-if="canCancelOrderById(order.id)"
                    @click="cancelOrderById(order.id)"
                    class="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useLunchStore } from '~/stores/lunch'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import OrderDeadlineWarning from '~/components/lunch/OrderDeadlineWarning.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const lunchStore = useLunchStore()

const loading = ref(true)
const error = ref('')
const selectedChildId = ref('')
const myChildren = ref<any[]>([])
const myOrders = ref<any[]>([])

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const todayOrder = computed(() => {
  if (!selectedChildId.value) return null
  return myOrders.value.find(order => 
    order.child_id === selectedChildId.value && 
    order.order_date === today.value
  )
})

const upcomingMenus = computed(() => {
  const todayDate = new Date()
  const nextWeek = new Date(todayDate)
  nextWeek.setDate(nextWeek.getDate() + 7)
  
  return lunchStore.menus.filter(menu => {
    const menuDate = new Date(menu.date)
    return menuDate >= todayDate && menuDate <= nextWeek
  })
})

const canCancelToday = computed(() => {
  if (!todayOrder.value) return false
  if (todayOrder.value.status === 'cancelled') return false
  
  const now = new Date()
  const deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  deadline.setHours(8, 0, 0, 0)
  
  return now < deadline
})

onMounted(async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // Fetch my children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .contains('parent_ids', [userId])

    myChildren.value = children || []
    if (myChildren.value.length > 0) {
      selectedChildId.value = myChildren.value[0].id
    }

    // Fetch upcoming menus
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    await lunchStore.fetchMenus(today, nextWeek.toISOString().split('T')[0])

    // Fetch my orders
    if (selectedChildId.value) {
      await lunchStore.fetchOrders(selectedChildId.value)
      myOrders.value = lunchStore.orders
    }
  } catch (error) {
    console.error('Error loading lunch data:', error)
  } finally {
    loading.value = false
  }
})

const hasOrdered = (menuId: string) => {
  if (!selectedChildId.value) return false
  return myOrders.value.some(o => o.menu_id === menuId && o.child_id === selectedChildId.value)
}

const placeOrder = async (menuId: string) => {
  if (!selectedChildId.value) return

  try {
    error.value = ''
    await lunchStore.createOrder({
      child_id: selectedChildId.value,
      menu_id: menuId,
      order_date: lunchStore.menus.find(m => m.id === menuId)?.date || new Date().toISOString().split('T')[0],
      status: 'confirmed',
      auto_created: false
    })

    // Refresh orders
    await lunchStore.fetchOrders(selectedChildId.value)
    myOrders.value = lunchStore.orders

    alert('Order placed successfully!')
  } catch (err: any) {
    error.value = err.message || 'Failed to place order'
    alert(error.value)
  }
}

const cancelOrderForMenu = async (menuId: string) => {
  if (!selectedChildId.value) return

  const order = myOrders.value.find(
    o => o.child_id === selectedChildId.value && o.menu_id === menuId
  )

  if (!order) return

  await cancelOrderById(order.id)
}

const cancelOrderById = async (orderId: string) => {
  try {
    error.value = ''
    await lunchStore.cancelOrder(orderId)

    // Refresh orders
    if (selectedChildId.value) {
      await lunchStore.fetchOrders(selectedChildId.value)
      myOrders.value = lunchStore.orders
    }

    alert('Order cancelled successfully!')
  } catch (err: any) {
    error.value = err.message || 'Failed to cancel order'
    alert(error.value)
  }
}

const canCancelOrder = (menuId: string) => {
  if (!selectedChildId.value) return false
  
  const order = myOrders.value.find(
    o => o.child_id === selectedChildId.value && o.menu_id === menuId
  )

  if (!order || order.status === 'cancelled') return false

  const orderDate = new Date(order.order_date)
  const todayDate = new Date()
  const isToday = orderDate.toDateString() === todayDate.toDateString()

  if (!isToday) return true // Can cancel future orders

  // For today's orders, check deadline
  const now = new Date()
  const deadline = new Date(todayDate)
  deadline.setHours(8, 0, 0, 0)

  return now < deadline
}

const canCancelOrderById = (orderId: string) => {
  const order = myOrders.value.find(o => o.id === orderId)
  if (!order) return false
  return canCancelOrder(order.menu_id)
}

const isTodayMenu = (menuId: string) => {
  const menu = lunchStore.menus.find(m => m.id === menuId)
  if (!menu) return false
  return menu.date === today.value
}

const getMenuName = (menuId: string) => {
  const menu = lunchStore.menus.find(m => m.id === menuId)
  return menu ? menu.meal_name : menuId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
