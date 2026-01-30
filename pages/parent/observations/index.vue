<template>
  <div>
    <div class="mb-6">
      <Heading size="xl">Beobachtungen</Heading>
      <p class="text-sm text-gray-600 mt-1">Entwicklungsbeobachtungen Ihrer Kinder</p>
    </div>

    <div class="mb-4 flex gap-4">
      <select
        v-model="selectedChildId"
        class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        @change="fetchObservations"
      >
        <option value="">Alle meine Kinder</option>
        <option v-for="child in myChildren" :key="child.id" :value="child.id">
          {{ child.first_name }} {{ child.last_name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error.message || 'Fehler beim Laden der Beobachtungen'" />
    </div>

    <div v-else class="space-y-6">
      <div v-if="observations.length === 0" class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Keine Beobachtungen gefunden.
      </div>

      <div
        v-for="observation in observations"
        :key="observation.id"
        class="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">
                {{ getChildName(observation.child_id) }}
              </h3>
              <p class="text-sm text-gray-600">{{ formatDate(observation.observation_date) }}</p>
              <span v-if="observation.development_area" class="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                {{ observation.development_area }}
              </span>
            </div>
            <NuxtLink
              :to="`/parent/observations/${observation.id}`"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              <span>👁️</span>
              <span>Vollständig ansehen</span>
            </NuxtLink>
          </div>

          <div v-if="observation.context" class="mb-3">
            <p class="text-sm text-gray-500 italic">📍 {{ observation.context }}</p>
          </div>

          <p class="text-gray-700 mb-4">{{ observation.description }}</p>

          <div v-if="observation.photos && observation.photos.length > 0" class="mt-4">
            <p class="text-sm font-medium text-gray-900 mb-2">📷 Fotos ({{ observation.photos.length }})</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div
                v-for="(photo, index) in observation.photos.slice(0, 4)"
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useObservationsStore } from '~/stores/observations'
import { useChildrenStore } from '~/stores/children'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const observationsStore = useObservationsStore()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()

const selectedChildId = ref('')
const { observations, loading, error } = storeToRefs(observationsStore)
const { children } = storeToRefs(childrenStore)

const myChildren = computed(() => {
  const userId = authStore.user?.id
  if (!userId) return []
  
  return children.value.filter(child => child.parent_ids?.includes(userId))
})

const filteredObservations = computed(() => {
  const myChildIds = myChildren.value.map(c => c.id)
  let filtered = observations.value.filter(obs => myChildIds.includes(obs.child_id))
  
  if (selectedChildId.value) {
    filtered = filtered.filter(obs => obs.child_id === selectedChildId.value)
  }
  
  return filtered.sort((a, b) => 
    new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime()
  )
})

onMounted(async () => {
  await Promise.all([
    observationsStore.fetchObservations(),
    childrenStore.fetchChildren()
  ])
})

const fetchObservations = async () => {
  await observationsStore.fetchObservations(selectedChildId.value || undefined)
}

const getChildName = (childId: string) => {
  const child = children.value.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
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
