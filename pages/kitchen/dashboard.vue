<template>
  <div>
    <Heading size="xl" class="mb-6">Kitchen Dashboard</Heading>
    
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Today's Orders" :value="todayOrders" icon="🛒" />
        <StatCard title="Menus This Week" :value="weeklyMenus" icon="🍽️" />
        <StatCard title="Pending Prep" :value="pendingPrep" icon="⏳" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <Heading size="md" class="mb-4">Today's Menu</Heading>
          <div v-if="!todayMenu" class="text-gray-500 text-sm">
            No menu for today
          </div>
          <div v-else>
            <p class="font-medium text-lg mb-2">{{ todayMenu.meal_name }}</p>
            <p class="text-gray-600 text-sm mb-3">{{ todayMenu.description }}</p>
            <div v-if="todayMenu.allergens && todayMenu.allergens.length > 0" class="text-xs text-orange-600">
              Allergens: {{ todayMenu.allergens.join(', ') }}
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <Heading size="md" class="mb-4">Quick Links</Heading>
          <div class="space-y-2">
            <NuxtLink
              to="/kitchen/menus"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              🍽️ Manage Menus
            </NuxtLink>
            <NuxtLink
              to="/kitchen/orders"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              🛒 View Orders
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import Heading from '~/components/ui/Heading.vue'
import StatCard from '~/components/common/StatCard.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'kitchen'
})

const supabase = useSupabaseClient()
const loading = ref(true)

const todayOrders = ref(0)
const weeklyMenus = ref(0)
const pendingPrep = ref(0)
const todayMenu = ref<any>(null)

onMounted(async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0]

    // Today's orders
    const { count: ordersCount } = await supabase
      .from('lunch_orders')
      .select('id', { count: 'exact', head: true })
      .eq('order_date', today)

    todayOrders.value = ordersCount || 0

    // Weekly menus
    const { count: menusCount } = await supabase
      .from('lunch_menus')
      .select('id', { count: 'exact', head: true })
      .gte('date', startOfWeekStr)

    weeklyMenus.value = menusCount || 0

    // Pending prep orders
    const { count: pendingCount } = await supabase
      .from('lunch_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    pendingPrep.value = pendingCount || 0

    // Today's menu
    const { data: menu } = await supabase
      .from('lunch_menus')
      .select('*')
      .eq('date', today)
      .single()

    todayMenu.value = menu
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>
