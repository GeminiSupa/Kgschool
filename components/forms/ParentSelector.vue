<template>
  <div class="space-y-3">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Parents <span class="text-red-500">*</span>
      </label>
      <div class="flex gap-2">
        <input
          v-model="searchQuery"
          type="text"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Search by email or name..."
          @input="searchParents"
        />
        <button
          type="button"
          @click="showCreateModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          ➕ Create New
        </button>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
      <p class="text-xs font-medium text-gray-600 mb-2">Search Results:</p>
      <div class="space-y-1">
        <div
          v-for="parent in searchResults"
          :key="parent.id"
          class="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
        >
          <div>
            <p class="text-sm font-medium">{{ parent.full_name }}</p>
            <p class="text-xs text-gray-600">{{ parent.email }}</p>
          </div>
          <button
            type="button"
            @click="addParent(parent)"
            :disabled="selectedParents.some(p => p.id === parent.id)"
            :class="[
              'px-3 py-1 text-xs rounded-md transition-colors',
              selectedParents.some(p => p.id === parent.id)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            ]"
          >
            {{ selectedParents.some(p => p.id === parent.id) ? 'Added' : 'Add' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Selected Parents -->
    <div v-if="selectedParents.length > 0" class="border border-gray-200 rounded-md p-3">
      <p class="text-xs font-medium text-gray-600 mb-2">Selected Parents:</p>
      <div class="space-y-2">
        <div
          v-for="parent in selectedParents"
          :key="parent.id"
          class="flex items-center justify-between p-2 bg-blue-50 rounded"
        >
          <div>
            <p class="text-sm font-medium">{{ parent.full_name }}</p>
            <p class="text-xs text-gray-600">{{ parent.email }}</p>
          </div>
          <button
            type="button"
            @click="removeParent(parent.id)"
            class="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>

    <p v-if="searchQuery && searchResults.length === 0 && !searching" class="text-xs text-gray-500">
      No parents found. Create a new parent account.
    </p>

    <!-- Create Parent Modal -->
    <CreateParentModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleParentCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import CreateParentModal from '~/components/modals/CreateParentModal.vue'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const supabase = useSupabaseClient()
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
const selectedParents = ref<any[]>([])
const showCreateModal = ref(false)

// Load selected parents on mount
const loadSelectedParents = async () => {
  if (props.modelValue && props.modelValue.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', props.modelValue)
      .eq('role', 'parent')
    
    selectedParents.value = data || []
  }
}

watch(() => props.modelValue, loadSelectedParents, { immediate: true })

onMounted(() => {
  loadSelectedParents()
})

const searchParents = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  searching.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'parent')
      .or(`email.ilike.%${searchQuery.value}%,full_name.ilike.%${searchQuery.value}%`)
      .limit(10)

    if (error) throw error
    searchResults.value = data || []
  } catch (e: any) {
    console.error('Search error:', e)
  } finally {
    searching.value = false
  }
}

const addParent = (parent: any) => {
  if (selectedParents.value.some(p => p.id === parent.id)) return

  selectedParents.value.push(parent)
  updateModelValue()
  searchQuery.value = ''
  searchResults.value = []
}

const removeParent = (parentId: string) => {
  selectedParents.value = selectedParents.value.filter(p => p.id !== parentId)
  updateModelValue()
}

const handleParentCreated = (parent: any) => {
  addParent(parent)
  showCreateModal.value = false
}

const updateModelValue = () => {
  emit('update:modelValue', selectedParents.value.map(p => p.id))
}
</script>
