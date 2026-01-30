<template>
  <div>
    <div class="mb-6">
      <NuxtLink
        to="/admin/observations"
        class="text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Back to Observations
      </NuxtLink>
      <Heading size="xl">Observation</Heading>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="!observation" class="p-8 text-center text-gray-500">
      Observation not found.
    </div>

    <div v-else class="bg-white rounded-lg shadow p-6 max-w-3xl">
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-500">Child</h3>
          <p class="mt-1 text-lg text-gray-900">{{ getChildName(observation.child_id) }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Date</h3>
          <p class="mt-1 text-gray-900">{{ formatDate(observation.observation_date) }}</p>
        </div>

        <div v-if="observation.context">
          <h3 class="text-sm font-medium text-gray-500">Context</h3>
          <p class="mt-1 text-gray-900">{{ observation.context }}</p>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500">Description</h3>
          <p class="mt-1 text-gray-900 whitespace-pre-wrap">{{ observation.description }}</p>
        </div>

        <div v-if="observation.development_area">
          <h3 class="text-sm font-medium text-gray-500">Development Area</h3>
          <p class="mt-1 text-gray-900">{{ observation.development_area }}</p>
        </div>

        <div v-if="observation.photos && observation.photos.length > 0" class="mt-4">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Photos</h3>
          <div class="grid grid-cols-3 gap-2">
            <img
              v-for="photo in observation.photos"
              :key="photo"
              :src="photo"
              alt="Observation photo"
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
import { useObservationsStore } from '~/stores/observations'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const observationsStore = useObservationsStore()
const childrenStore = useChildrenStore()

const loading = ref(true)
const observation = ref<any>(null)

const { children } = storeToRefs(childrenStore)

onMounted(async () => {
  try {
    const observationId = route.params.id as string
    await observationsStore.fetchObservations()
    observation.value = observationsStore.observations.find(o => o.id === observationId)
    await childrenStore.fetchChildren()
  } finally {
    loading.value = false
  }
})

const getChildName = (childId: string) => {
  const child = children.find(c => c.id === childId)
  return child ? `${child.first_name} ${child.last_name}` : childId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
