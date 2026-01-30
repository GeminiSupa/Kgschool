<template>
  <div>
    <div class="mb-6">
      <Heading size="xl">Tagesberichte</Heading>
      <p class="text-sm text-gray-600 mt-1">Sehen Sie, was Ihre Kinder heute erlebt haben</p>
    </div>

    <div class="mb-4">
      <input
        v-model="selectedDate"
        type="date"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchReports"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-6">
      <div v-if="reports.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Keine Tagesberichte für dieses Datum gefunden.
      </div>

      <div
        v-for="report in reports"
        :key="report.id"
        class="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ report.title }}</h3>
              <p class="text-sm text-gray-600">{{ formatDate(report.report_date) }}</p>
              <p class="text-sm text-gray-500 mt-1">{{ getGroupName(report.group_id) }}</p>
            </div>
            <NuxtLink
              :to="`/parent/daily-reports/${report.id}`"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              <span>👁️</span>
              <span>Vollständig ansehen</span>
            </NuxtLink>
          </div>

          <div class="prose max-w-none">
            <p class="text-gray-700 mb-4">{{ report.content }}</p>

            <div v-if="report.activities && report.activities.length > 0" class="mb-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-2">Aktivitäten des Tages:</h4>
              <ul class="list-disc list-inside text-gray-700 space-y-1">
                <li v-for="activity in report.activities" :key="activity">{{ activity }}</li>
              </ul>
            </div>

            <div v-if="report.weather" class="mb-4">
              <p class="text-sm text-gray-600">
                <span class="font-medium">Wetter:</span> {{ report.weather }}
              </p>
            </div>

            <div v-if="report.special_events" class="mb-4">
              <p class="text-sm text-gray-700">
                <span class="font-medium">Besondere Ereignisse:</span> {{ report.special_events }}
              </p>
            </div>

            <div v-if="report.photos && report.photos.length > 0" class="mt-4">
              <p class="text-sm font-medium text-gray-900 mb-2">📷 Fotos ({{ report.photos.length }})</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div
                  v-for="(photo, index) in report.photos.slice(0, 4)"
                  :key="index"
                  class="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img :src="photo" :alt="`Foto ${index + 1}`" class="w-full h-full object-cover" />
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
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDailyReportsStore } from '~/stores/dailyReports'
import { useGroupsStore } from '~/stores/groups'
import { useChildrenStore } from '~/stores/children'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const dailyReportsStore = useDailyReportsStore()
const groupsStore = useGroupsStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const { dailyReports, loading, error } = storeToRefs(dailyReportsStore)

const myChildrenGroups = computed(() => {
  const userId = authStore.user?.id
  if (!userId) return []
  
  return childrenStore.children
    .filter(child => child.parent_ids?.includes(userId))
    .map(child => child.group_id)
    .filter(Boolean)
})

const reports = computed(() => {
  return dailyReports.value.filter(report => 
    myChildrenGroups.value.includes(report.group_id)
  )
})

onMounted(async () => {
  await Promise.all([
    dailyReportsStore.fetchDailyReports(),
    groupsStore.fetchGroups(),
    childrenStore.fetchChildren()
  ])
})

const fetchReports = async () => {
  await dailyReportsStore.fetchDailyReports(undefined, selectedDate.value)
}

const getGroupName = (groupId: string) => {
  const group = groupsStore.groups.find(g => g.id === groupId)
  return group ? group.name : groupId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
