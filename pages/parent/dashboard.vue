<template>
  <div>
    <Heading size="xl" class="mb-6">Parent Dashboard</Heading>
    
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="My Children" :value="myChildren.length" icon="👶" />
        <StatCard title="Unread Messages" :value="unreadMessages" icon="💬" />
        <StatCard title="Upcoming Events" :value="0" icon="📅" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <Heading size="md" class="mb-4">My Children</Heading>
          <div v-if="myChildren.length === 0" class="text-gray-500 text-sm">
            No children registered yet
          </div>
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="child in myChildren"
              :key="child.id"
              :to="`/parent/children/${child.id}`"
              class="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <p class="font-medium">{{ child.first_name }} {{ child.last_name }}</p>
              <p class="text-sm text-gray-600">Group: {{ child.group_id || 'Unassigned' }}</p>
            </NuxtLink>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <Heading size="md" class="mb-4">Quick Actions</Heading>
          <div class="space-y-2">
            <NuxtLink
              to="/parent/children"
              class="block w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              👶 View My Children
            </NuxtLink>
            <NuxtLink
              to="/parent/attendance"
              class="block w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              ✅ Check Attendance
            </NuxtLink>
            <NuxtLink
              to="/parent/lunch"
              class="block w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              🍽️ Order Lunch
            </NuxtLink>
            <NuxtLink
              to="/parent/messages"
              class="block w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              💬 Messages
            </NuxtLink>
            <NuxtLink
              to="/parent/billing"
              class="block w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              💰 Billing
            </NuxtLink>
            <NuxtLink
              to="/parent/leave/new"
              class="block w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              📝 Request Leave
            </NuxtLink>
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
import Heading from '~/components/ui/Heading.vue'
import StatCard from '~/components/common/StatCard.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const loading = ref(true)

const myChildren = ref<any[]>([])
const unreadMessages = ref(0)

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

    // Count unread messages
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null)

    unreadMessages.value = count || 0
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>
