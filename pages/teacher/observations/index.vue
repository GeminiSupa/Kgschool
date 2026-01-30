<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <Heading size="xl">Beobachtungen</Heading>
        <p class="text-sm text-gray-600 mt-1">Dokumentieren Sie die Entwicklung der Kinder</p>
      </div>
      <NuxtLink
        to="/teacher/observations/new"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
      >
        <span>➕</span>
        <span>Neue Beobachtung</span>
      </NuxtLink>
    </div>

    <div class="mb-4 flex gap-4">
      <select
        v-model="selectedChildId"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchObservations"
      >
        <option value="">Alle Kinder</option>
        <option v-for="child in myChildren" :key="child.id" :value="child.id">
          {{ child.first_name }} {{ child.last_name }}
        </option>
      </select>
      <input
        v-model="selectedDate"
        type="date"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchObservations"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error.message || 'Fehler beim Laden der Beobachtungen'" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="observations.length === 0" class="p-8 text-center text-gray-500">
        Keine Beobachtungen gefunden.
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="observation in observations"
          :key="observation.id"
          class="p-6 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-medium text-gray-900">{{ getChildName(observation.child_id) }}</h3>
                <span v-if="observation.development_area" class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {{ observation.development_area }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">{{ formatDate(observation.observation_date) }}</p>
              <p v-if="observation.context" class="text-sm text-gray-500 mb-2 italic">{{ observation.context }}</p>
              <p class="text-gray-700 mb-3">{{ observation.description }}</p>
              <div v-if="observation.photos && observation.photos.length > 0" class="mt-2">
                <span class="text-xs text-gray-500">📷 {{ observation.photos.length }} Fotos</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <NuxtLink
                :to="`/teacher/observations/${observation.id}`"
                class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                <span>👁️</span>
                <span>Ansehen</span>
              </NuxtLink>
              <NuxtLink
                :to="`/teacher/observations/${observation.id}?edit=true`"
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
import { useObservationsStore } from '~/stores/observations'
import { useChildrenStore } from '~/stores/children'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'teacher'
})

const observationsStore = useObservationsStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()

const selectedChildId = ref('')
const selectedDate = ref('')
const { observations, loading, error } = storeToRefs(observationsStore)
const { children } = storeToRefs(childrenStore)

const myChildren = computed(() => {
  // Filter children by teacher's groups
  const userId = authStore.user?.id
  if (!userId) return []
  
  // In a real app, filter by groups where user is educator
  return children.value
})

onMounted(async () => {
  await Promise.all([
    observationsStore.fetchObservations(),
    childrenStore.fetchChildren()
  ])
})

const fetchObservations = async () => {
  await observationsStore.fetchObservations(
    selectedChildId.value || undefined,
    selectedDate.value || undefined
  )
}

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE')
}
</script>
