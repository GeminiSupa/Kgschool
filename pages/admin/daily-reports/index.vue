<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <Heading size="xl">Tagesberichte</Heading>
        <p class="text-sm text-gray-600 mt-1">Tägliche Berichte für Eltern über die Aktivitäten der Gruppe</p>
      </div>
      <NuxtLink
        to="/admin/daily-reports/new"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        <span>➕</span>
        <span>Neuer Tagesbericht</span>
      </NuxtLink>
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

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="reports.length === 0" class="p-8 text-center text-gray-500">
        No daily reports found for this date.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="report in reports"
          :key="report.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-medium text-gray-900">{{ report.title }}</h3>
                <span class="text-sm text-gray-500">{{ getGroupName(report.group_id) }}</span>
              </div>
              <p class="text-sm text-gray-600 mb-2">{{ formatDate(report.report_date) }}</p>
              <p class="text-gray-700 mb-3">{{ report.content }}</p>
              <div v-if="report.activities && report.activities.length > 0" class="mb-2">
                <p class="text-sm font-medium text-gray-700">Activities:</p>
                <ul class="text-sm text-gray-600 list-disc list-inside">
                  <li v-for="activity in report.activities" :key="activity">{{ activity }}</li>
                </ul>
              </div>
              <div v-if="report.photos && report.photos.length > 0" class="mt-2">
                <span class="text-xs text-gray-500">📷 {{ report.photos.length }} photos</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <NuxtLink
                :to="`/admin/daily-reports/${report.id}`"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                <span>👁️</span>
                <span>Ansehen</span>
              </NuxtLink>
              <NuxtLink
                :to="`/admin/daily-reports/${report.id}?edit=true`"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors"
              >
                <span>✏️</span>
                <span>Bearbeiten</span>
              </NuxtLink>
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
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const dailyReportsStore = useDailyReportsStore()
const groupsStore = useGroupsStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const { dailyReports: reports, loading, error } = storeToRefs(dailyReportsStore)

onMounted(async () => {
  await Promise.all([
    dailyReportsStore.fetchDailyReports(undefined, selectedDate.value),
    groupsStore.fetchGroups()
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
  return new Date(date).toLocaleDateString()
}
</script>
