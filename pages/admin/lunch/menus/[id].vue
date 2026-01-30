<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/menus"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Lunch Menus
      </NuxtLink>
      <Heading size="xl">Lunch Menu</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="!menu" class="p-8 text-center text-gray-500">
      Lunch menu not found.
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-500">Meal Name</h3>
          <p class="mt-1 text-lg text-gray-900">{{ menu.meal_name }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Date</h3>
          <p class="mt-1 text-gray-900">{{ formatDate(menu.date) }}</p>
        </div>

        <div v-if="menu.description">
          <h3 class="text-sm font-medium text-gray-500">Description</h3>
          <p class="mt-1 text-gray-900">{{ menu.description }}</p>
        </div>

        <div v-if="menu.allergens && menu.allergens.length > 0">
          <h3 class="text-sm font-medium text-gray-500">Allergens</h3>
          <div class="mt-1 flex flex-wrap gap-2">
            <span
              v-for="allergen in menu.allergens"
              :key="allergen"
              class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
            >
              {{ allergen }}
            </span>
          </div>
        </div>

        <div v-if="menu.nutritional_info && Object.keys(menu.nutritional_info).length > 0">
          <h3 class="text-sm font-medium text-gray-500">Nutritional Information</h3>
          <div class="mt-1 grid grid-cols-2 gap-4">
            <div v-for="(value, key) in menu.nutritional_info" :key="key">
              <span class="text-sm text-gray-600 capitalize">{{ key }}:</span>
              <span class="ml-2 text-gray-900">{{ value }}</span>
            </div>
          </div>
        </div>

        <div v-if="menu.photo_url" class="mt-4">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Photo</h3>
          <img
            :src="menu.photo_url"
            :alt="menu.meal_name"
            class="w-full max-w-md h-64 object-cover rounded-md"
          />
        </div>

        <div class="pt-4 border-t">
          <h3 class="text-sm font-medium text-gray-500 mb-4">Orders for this Menu</h3>
          <div v-if="orders.length === 0" class="text-gray-500 text-sm">
            No orders for this menu yet.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="order in orders"
              :key="order.id"
              class="p-3 bg-gray-50 rounded-md flex items-center justify-between"
            >
              <div>
                <p class="font-medium text-sm">{{ getChildName(order.child_id) }}</p>
                <p class="text-xs text-gray-600">
                  Status: 
                  <span
                    :class="[
                      'font-medium',
                      order.status === 'confirmed' ? 'text-green-600' :
                      order.status === 'cancelled' ? 'text-red-600' :
                      'text-gray-600'
                    ]"
                  >
                    {{ order.status }}
                  </span>
                </p>
                <p v-if="order.special_requests" class="text-xs text-gray-500 mt-1">
                  Special requests: {{ order.special_requests }}
                </p>
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
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useLunchStore } from '~/stores/lunch'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['admin', 'kitchen']
})

const route = useRoute()
const supabase = useSupabaseClient()
const lunchStore = useLunchStore()
const childrenStore = useChildrenStore()

const loading = ref(true)
const error = ref('')
const menu = ref<any>(null)
const orders = ref<any[]>([])

const { children } = storeToRefs(childrenStore)

onMounted(async () => {
  try {
    const menuId = route.params.id as string
    
    // Fetch menu
    const { data: menuData, error: menuError } = await supabase
      .from('lunch_menus')
      .select('*')
      .eq('id', menuId)
      .single()

    if (menuError) throw menuError
    if (!menuData) {
      error.value = 'Menu not found'
      return
    }

    menu.value = menuData

    // Fetch orders for this menu
    await lunchStore.fetchOrders(undefined, menuId)
    orders.value = lunchStore.orders.filter(o => o.menu_id === menuId)

    // Fetch children for names
    await childrenStore.fetchChildren()
  } catch (e: any) {
    error.value = e.message || 'Failed to load menu'
  } finally {
    loading.value = false
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const getChildName = (childId: string) => {
  const child = children.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}
</script>
