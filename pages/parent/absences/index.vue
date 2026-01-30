<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <Heading size="xl">Absence Notifications</Heading>
      <NuxtLink
        to="/parent/absences/new"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ Notify Absence
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="notifications.length === 0" class="p-8 text-center text-gray-500">
        No absence notifications yet.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-lg font-medium text-gray-900">
                {{ getChildName(notification.child_id) }}
              </p>
              <p class="text-sm text-gray-600 mt-1">
                Absence Date: {{ formatDate(notification.absence_date) }}
              </p>
              <p class="text-xs text-gray-500 mt-2">
                Notified: {{ formatDateTime(notification.notified_at) }}
              </p>
              <div class="mt-2">
                <span
                  :class="[
                    'inline-block px-2 py-1 text-xs font-medium rounded-full',
                    notification.deadline_met
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ notification.deadline_met ? '✓ Deadline Met (Refundable)' : '⚠ Deadline Not Met' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAbsencesStore } from '~/stores/absences'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const absencesStore = useAbsencesStore()
const childrenStore = useChildrenStore()

const { notifications, loading, error } = storeToRefs(absencesStore)
const { children } = storeToRefs(childrenStore)

onMounted(async () => {
  await Promise.all([
    absencesStore.fetchNotifications(),
    childrenStore.fetchChildren()
  ])
})

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString()
}
</script>
