<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/daily-reports"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Daily Reports
      </NuxtLink>
      <Heading size="xl">Daily Report</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="!report" class="p-8 text-center text-gray-500">
      Daily report not found.
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-500">Title</h3>
          <p class="mt-1 text-lg text-gray-900">{{ report.title }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Group</h3>
          <p class="mt-1 text-gray-900">{{ getGroupName(report.group_id) }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Date</h3>
          <p class="mt-1 text-gray-900">{{ formatDate(report.report_date) }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Content</h3>
          <p class="mt-1 text-gray-900 whitespace-pre-wrap">{{ report.content }}</p>
        </div>

        <div v-if="report.activities && report.activities.length > 0">
          <h3 class="text-sm font-medium text-gray-500">Activities</h3>
          <ul class="mt-1 list-disc list-inside text-gray-900">
            <li v-for="activity in report.activities" :key="activity">{{ activity }}</li>
          </ul>
        </div>

        <div v-if="report.weather">
          <h3 class="text-sm font-medium text-gray-500">Weather</h3>
          <p class="mt-1 text-gray-900">{{ report.weather }}</p>
        </div>

        <div v-if="report.special_events">
          <h3 class="text-sm font-medium text-gray-500">Special Events</h3>
          <p class="mt-1 text-gray-900">{{ report.special_events }}</p>
        </div>

        <div v-if="report.photos && report.photos.length > 0" class="mt-4">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Photos</h3>
          <div class="grid grid-cols-3 gap-2">
            <img
              v-for="photo in report.photos"
              :key="photo"
              :src="photo"
              alt="Report photo"
              class="w-full h-32 object-cover rounded-md"
            />
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
import { useDailyReportsStore } from '~/stores/dailyReports'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const dailyReportsStore = useDailyReportsStore()
const groupsStore = useGroupsStore()

const loading = ref(true)
const report = ref<any>(null)

const { groups } = storeToRefs(groupsStore)

onMounted(async () => {
  try {
    const reportId = route.params.id as string
    await dailyReportsStore.fetchDailyReports()
    report.value = dailyReportsStore.dailyReports.find(r => r.id === reportId)
    await groupsStore.fetchGroups()
  } finally {
    loading.value = false
  }
})

const getGroupName = (groupId: string) => {
  const group = groups.find(g => g.id === groupId)
  return group ? group.name : groupId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
