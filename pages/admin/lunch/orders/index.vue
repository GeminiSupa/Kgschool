<template>
  <div>
    <Heading size="xl" class="mb-6">Lunch Orders</Heading>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="orders.length === 0" class="p-8 text-center text-gray-500">
        No orders found.
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Child
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Menu
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Order Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Auto Created
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ getChildName(order.child_id) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ getMenuName(order.menu_id) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(order.order_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
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
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span v-if="order.auto_created" class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                Yes
              </span>
              <span v-else class="text-gray-400">No</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLunchStore } from '~/stores/lunch'
import { useChildrenStore } from '~/stores/children'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['admin', 'kitchen']
})

const lunchStore = useLunchStore()
const childrenStore = useChildrenStore()
const { getUserKitaId } = useKita()
const { orders, loading, error } = storeToRefs(lunchStore)

const children = ref<any[]>([])
const menus = ref<any[]>([])

onMounted(async () => {
  const kitaId = await getUserKitaId()
  await Promise.all([
    lunchStore.fetchOrders(undefined, undefined, kitaId || undefined),
    childrenStore.fetchChildren(kitaId || undefined),
    lunchStore.fetchMenus(undefined, undefined, kitaId || undefined)
  ])
  children.value = childrenStore.children
  menus.value = lunchStore.menus
})

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const getMenuName = (menuId: string) => {
  const menu = menus.value.find(m => m.id === menuId)
  return menu ? menu.meal_name : menuId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
