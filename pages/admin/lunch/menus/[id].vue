<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/lunch/menus"
        class="link-fiori mb-4 inline-block"
      >
        ← Back to Lunch Menus
      </NuxtLink>
      <Heading size="xl" class="text-white drop-shadow">Mittagessen-Menü</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

      <div v-else-if="!menu" class="empty-state-fiori">
        <div class="empty-state-fiori-icon">🍽️</div>
        <p class="empty-state-fiori-title">Menü nicht gefunden</p>
      </div>

    <div v-else class="card-fiori card-orange rounded-lg shadow p-6 max-w-3xl">
      <div class="space-y-4">
        <div>
          <h3 class="form-label-fiori text-fiori-blue-600">Gerichtname</h3>
          <p class="mt-1 text-lg text-fiori-gray-900 font-semibold">{{ menu.meal_name }}</p>
        </div>

        <div>
          <h3 class="form-label-fiori text-fiori-blue-600">Datum</h3>
          <p class="mt-1 text-fiori-gray-900">{{ formatDate(menu.date) }}</p>
        </div>

        <div v-if="menu.description">
          <h3 class="form-label-fiori text-fiori-blue-600">Beschreibung</h3>
          <p class="mt-1 text-fiori-gray-900">{{ menu.description }}</p>
        </div>

        <div v-if="menu.allergens && menu.allergens.length > 0">
          <h3 class="form-label-fiori text-fiori-blue-600">Allergene</h3>
          <div class="mt-1 flex flex-wrap gap-2">
            <span
              v-for="allergen in menu.allergens"
              :key="allergen"
              class="badge-fiori badge-fiori-warning"
            >
              {{ allergen }}
            </span>
          </div>
        </div>

        <div v-if="menu.nutritional_info && Object.keys(menu.nutritional_info).length > 0">
          <h3 class="form-label-fiori text-fiori-blue-600">Nährwertinformationen</h3>
          <div class="mt-1 grid grid-cols-2 gap-4">
            <div v-for="(value, key) in menu.nutritional_info" :key="key">
              <span class="text-sm text-fiori-gray-900 capitalize font-medium">{{ key }}:</span>
              <span class="ml-2 text-fiori-gray-700">{{ value }}</span>
            </div>
          </div>
        </div>

        <div v-if="menu.photo_url" class="mt-4">
          <h3 class="form-label-fiori text-fiori-blue-600 mb-2">Foto</h3>
          <img
            :src="menu.photo_url"
            :alt="menu.meal_name"
            class="w-full max-w-md h-64 object-cover rounded-md"
          />
        </div>

        <div class="pt-4 border-t border-fiori-gray-200 flex justify-between items-center mb-4">
          <h3 class="form-label-fiori text-fiori-blue-600">Bestellungen für dieses Menü</h3>
          <NuxtLink
            :to="`/admin/lunch/menus/${menu.id}/edit`"
            class="ios-button ios-button-primary inline-flex items-center gap-2"
          >
            ✏️ Menü bearbeiten
          </NuxtLink>
        </div>
        <div>
          <div v-if="orders.length === 0" class="text-fiori-gray-600 text-sm">
            Noch keine Bestellungen für dieses Menü.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="order in orders"
              :key="order.id"
              class="p-3 bg-fiori-gray-50 rounded-md flex items-center justify-between"
            >
              <div>
                <p class="font-medium text-sm text-fiori-gray-900">{{ getChildName(order.child_id) }}</p>
                <p class="text-xs text-fiori-gray-700">
                  Status: 
                  <span
                    :class="[
                      'badge-fiori ml-1',
                      order.status === 'confirmed' ? 'badge-fiori-success' :
                      order.status === 'cancelled' ? 'badge-fiori-error' :
                      'badge-fiori-neutral'
                    ]"
                  >
                    {{ order.status === 'confirmed' ? 'Bestätigt' : order.status === 'cancelled' ? 'Storniert' : order.status }}
                  </span>
                </p>
                <p v-if="order.special_requests" class="text-xs text-fiori-gray-700 mt-1">
                  Besondere Wünsche: {{ order.special_requests }}
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
