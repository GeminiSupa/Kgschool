<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        :to="`/admin/children/${childId}`"
        class="text-gray-600 hover:text-gray-900"
      >
        ← Back to Child
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="mb-6">
          <Heading size="xl" class="mb-2">Manage Parents</Heading>
          <p class="text-lg font-medium text-gray-900">Child: {{ childName }}</p>
        </div>

        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">
              Search Parent by Email or Name
            </label>
            <button
              @click="showCreateModal = true"
              class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              ➕ Create New Parent
            </button>
          </div>
          <div class="flex gap-2">
            <input
              v-model="searchQuery"
              type="text"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email or name..."
              @input="searchParents"
              @keyup.enter="searchParents"
            />
            <button
              @click="searchParents"
              :disabled="searching"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ searching ? 'Searching...' : 'Search' }}
            </button>
          </div>
        </div>

        <div v-if="searchResults.length > 0" class="mb-6">
          <p class="text-sm font-medium text-gray-700 mb-2">Search Results:</p>
          <div class="space-y-2">
            <div
              v-for="parent in searchResults"
              :key="parent.id"
              class="p-3 bg-gray-50 rounded-md flex items-center justify-between"
            >
              <div>
                <p class="font-medium">{{ parent.full_name }}</p>
                <p class="text-sm text-gray-600">{{ parent.email }}</p>
              </div>
              <button
                @click="addParent(parent.id)"
                :disabled="currentParentIds.includes(parent.id)"
                :class="[
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  currentParentIds.includes(parent.id)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                ]"
              >
                {{ currentParentIds.includes(parent.id) ? 'Already Added' : 'Add' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="searchQuery && searchResults.length === 0 && !searching" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p class="text-sm text-yellow-800">
            No parents found matching "{{ searchQuery }}". Make sure the parent has an account with role 'parent'.
          </p>
        </div>
        
        <div v-if="searching" class="mb-6 text-center py-4 text-gray-500 text-sm">
          Searching...
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <Heading size="md" class="mb-4">Current Parents</Heading>
        <div v-if="currentParents.length === 0" class="text-gray-500 text-sm">
          No parents linked to this child.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="parent in currentParents"
            :key="parent.id"
            class="p-3 bg-gray-50 rounded-md flex items-center justify-between"
          >
            <div>
              <p class="font-medium">{{ parent.full_name }}</p>
              <p class="text-sm text-gray-600">{{ parent.email }}</p>
            </div>
            <button
              @click="removeParent(parent.id)"
              class="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Parent Modal -->
    <CreateParentModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleParentCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient } from '#imports'
import { useChildrenStore } from '~/stores/children'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import CreateParentModal from '~/components/modals/CreateParentModal.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'admin'
})

const route = useRoute()
const supabase = useSupabaseClient()
const childrenStore = useChildrenStore()

const childId = route.params.id as string
const loading = ref(true)
const error = ref('')
const childName = ref('')
const currentParentIds = ref<string[]>([])
const currentParents = ref<any[]>([])
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
const showCreateModal = ref(false)

onMounted(async () => {
  await loadChild()
})

const loadChild = async () => {
  try {
    const child = await childrenStore.fetchChildById(childId)
    if (!child) {
      error.value = 'Child not found'
      return
    }

    childName.value = `${child.first_name} ${child.last_name}`
    currentParentIds.value = child.parent_ids || []

    // Load parent details
    if (currentParentIds.value.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', currentParentIds.value)
        .eq('role', 'parent')

      currentParents.value = data || []
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load child'
  } finally {
    loading.value = false
  }
}

const searchParents = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  // Validate search query length
  if (searchQuery.value.trim().length < 2) {
    alert('Please enter at least 2 characters to search')
    return
  }

  searching.value = true
  try {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'parent')
      .or(`email.ilike.%${searchQuery.value.trim()}%,full_name.ilike.%${searchQuery.value.trim()}%`)
      .limit(10)

    if (err) throw err
    searchResults.value = data || []
  } catch (e: any) {
    console.error('Search error:', e)
    alert('Failed to search parents. Please try again.')
  } finally {
    searching.value = false
  }
}

const addParent = async (parentId: string) => {
  // Validation
  if (!parentId) {
    alert('Invalid parent ID')
    return
  }

  if (currentParentIds.value.includes(parentId)) {
    alert('This parent is already linked to this child')
    return
  }

  try {
    const newParentIds = [...currentParentIds.value, parentId]

    const { error: err } = await supabase
      .from('children')
      .update({ parent_ids: newParentIds })
      .eq('id', childId)

    if (err) throw err

    currentParentIds.value = newParentIds

    // Reload parent details
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', parentId)
      .single()

    if (data) {
      currentParents.value.push(data)
    }

    // Clear search
    searchQuery.value = ''
    searchResults.value = []
  } catch (e: any) {
    console.error('Error adding parent:', e)
    alert(e.message || 'Failed to add parent. Please try again.')
  }
}

const removeParent = async (parentId: string) => {
  if (!confirm('Remove this parent from the child?')) return

  try {
    const newParentIds = currentParentIds.value.filter(id => id !== parentId)

    const { error: err } = await supabase
      .from('children')
      .update({ parent_ids: newParentIds })
      .eq('id', childId)

    if (err) throw err

    currentParentIds.value = newParentIds
    currentParents.value = currentParents.value.filter(p => p.id !== parentId)
  } catch (e: any) {
    console.error('Error removing parent:', e)
    alert(e.message || 'Failed to remove parent. Please try again.')
  }
}

const handleParentCreated = async (newParent: any) => {
  showCreateModal.value = false
  // Automatically add the newly created parent to the child
  if (newParent && newParent.id) {
    await addParent(newParent.id)
    alert('Parent created and linked to child successfully!')
  }
}
</script>
