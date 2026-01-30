<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <Heading size="xl">Tagesablauf</Heading>
        <p class="text-sm text-gray-600 mt-1">Tägliche Routinen und Abläufe für die Gruppen</p>
      </div>
      <NuxtLink
        to="/admin/daily-routines/new"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        <span>➕</span>
        <span>Neue Routine</span>
      </NuxtLink>
    </div>

    <div class="mb-4">
      <select
        v-model="selectedGroupId"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchRoutines"
      >
        <option value="">Alle Gruppen</option>
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error.message || 'Error loading daily routines'" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="routines.length === 0" class="p-8 text-center text-gray-500">
        No daily routines found.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="routine in routines"
          :key="routine.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-medium text-gray-900">{{ routine.routine_name }}</h3>
                <span class="text-sm text-gray-500">{{ getGroupName(routine.group_id) }}</span>
              </div>
              <p class="text-sm text-gray-600 mb-2">
                {{ formatTime(routine.start_time) }}
                <span v-if="routine.end_time"> - {{ formatTime(routine.end_time) }}</span>
              </p>
              <p v-if="routine.day_of_week !== null" class="text-sm text-gray-500 mb-2">
                {{ getDayName(routine.day_of_week) }}
              </p>
              <p v-else class="text-sm text-gray-500 mb-2">Every day</p>
              <p v-if="routine.description" class="text-gray-700 mb-2">{{ routine.description }}</p>
              <p v-if="routine.location" class="text-sm text-gray-500">📍 {{ routine.location }}</p>
              <div v-if="!routine.is_active" class="mt-2">
                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">Inaktiv</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <NuxtLink
                :to="`/admin/daily-routines/${routine.id}?edit=true`"
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
import { useDailyRoutinesStore } from '~/stores/dailyRoutines'
import { useGroupsStore } from '~/stores/groups'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const dailyRoutinesStore = useDailyRoutinesStore()
const groupsStore = useGroupsStore()

const selectedGroupId = ref('')
const { dailyRoutines: routines, loading, error } = storeToRefs(dailyRoutinesStore)
const { groups } = storeToRefs(groupsStore)

onMounted(async () => {
  await Promise.all([
    dailyRoutinesStore.fetchDailyRoutines(),
    groupsStore.fetchGroups()
  ])
})

const fetchRoutines = async () => {
  await dailyRoutinesStore.fetchDailyRoutines(selectedGroupId.value || undefined)
}

const getGroupName = (groupId: string) => {
  const group = groups.value.find(g => g.id === groupId)
  return group ? group.name : groupId
}

const formatTime = (time: string) => {
  return time.substring(0, 5) // HH:MM format
}

const getDayName = (day: number) => {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
  return days[day] || 'Unbekannt'
}
</script>
