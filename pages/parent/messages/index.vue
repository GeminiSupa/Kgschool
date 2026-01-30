<template>
  <div>
    <Heading size="xl" class="mb-6">Messages</Heading>

    <div class="mb-4 flex gap-4 border-b border-gray-200">
      <button
        @click="activeTab = 'inbox'"
        :class="[
          'px-4 py-2 font-medium transition-colors border-b-2',
          activeTab === 'inbox'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        ]"
      >
        Inbox
        <span v-if="unreadCount > 0" class="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
          {{ unreadCount }}
        </span>
      </button>
      <button
        @click="activeTab = 'outbox'"
        :class="[
          'px-4 py-2 font-medium transition-colors border-b-2',
          activeTab === 'outbox'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        ]"
      >
        Sent
      </button>
      <button
        @click="handleComposeClick"
        class="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        ➕ Compose
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="displayMessages.length === 0" class="p-8 text-center text-gray-500">
        {{ activeTab === 'inbox' ? 'No messages in inbox' : 'No sent messages' }}
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div
          v-for="message in displayMessages"
          :key="message.id"
          class="block p-6 hover:bg-gray-50 transition-colors cursor-pointer"
          :class="{ 'bg-blue-50': !message.read_at }"
          @click="viewMessage(message.id)"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="font-medium text-gray-900">
                {{ activeTab === 'inbox' ? getSenderName(message.sender_id) : getRecipientName(message.recipient_id) }}
              </p>
              <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ message.content }}</p>
              <p class="text-xs text-gray-500 mt-2">{{ formatDate(message.created_at) }}</p>
            </div>
            <span v-if="!message.read_at && activeTab === 'inbox'" class="ml-4 w-2 h-2 bg-blue-600 rounded-full"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Compose Modal -->
    <div
      v-if="showCompose"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showCompose = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 class="text-lg font-medium mb-4">Compose Message</h3>
        <form @submit.prevent="sendMessage" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">To *</label>
            <div v-if="profilesLoading" class="text-sm text-gray-500 py-2">
              Loading recipients...
            </div>
            <select
              v-else
              v-model="composeForm.recipient_id"
              required
              :disabled="profilesLoading || profiles.length === 0"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {{ profiles.length === 0 ? 'No recipients available' : 'Select recipient' }}
              </option>
              <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
                {{ profile.full_name }} ({{ profile.role }})
              </option>
            </select>
            <p v-if="profilesError" class="mt-1 text-sm text-red-600">{{ profilesError }}</p>
            <p v-else-if="profiles.length === 0 && !profilesLoading" class="mt-1 text-sm text-gray-500">
              No recipients available. You can message teachers, admins, and staff.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              v-model="composeForm.content"
              required
              rows="6"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
            />
          </div>
          <div v-if="composeError" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {{ composeError }}
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="showCompose = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="composeLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ composeLoading ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useMessagesStore } from '~/stores/messages'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'parent'
})

const supabase = useSupabaseClient()
const authStore = useAuthStore()
const messagesStore = useMessagesStore()

const activeTab = ref<'inbox' | 'outbox'>('inbox')
const showCompose = ref(false)
const profiles = ref<any[]>([])
const profilesLoading = ref(false)
const profilesError = ref('')

const { messages, loading, error, unreadCount } = storeToRefs(messagesStore)

const displayMessages = computed(() => {
  const userId = authStore.user?.id
  if (!userId) return []
  
  if (activeTab.value === 'inbox') {
    return messagesStore.inbox(userId)
  } else {
    return messagesStore.outbox(userId)
  }
})

const composeForm = ref({
  recipient_id: '',
  content: ''
})

const composeLoading = ref(false)
const composeError = ref('')

onMounted(async () => {
  const userId = authStore.user?.id
  if (!userId) return

  await Promise.all([
    messagesStore.fetchMessages(userId, 'all'),
    fetchProfiles()
  ])
})

const fetchProfiles = async () => {
  profilesLoading.value = true
  profilesError.value = ''
  
  try {
    const userId = authStore.user?.id
    if (!userId) {
      profilesError.value = 'Not authenticated'
      return
    }
    
    const response = await $fetch('/api/parent/messages/recipients', {
      params: {
        user_id: userId
      }
    })
    
    if (response.success) {
      profiles.value = response.profiles || []
    } else {
      profilesError.value = 'Failed to load recipients'
    }
  } catch (e: any) {
    console.error('Error fetching profiles:', e)
    profilesError.value = e.data?.message || e.message || 'Failed to load recipients'
    profiles.value = []
  } finally {
    profilesLoading.value = false
  }
}

const sendMessage = async () => {
  composeLoading.value = true
  composeError.value = ''

  try {
    const userId = authStore.user?.id
    if (!userId) throw new Error('Not authenticated')

    await messagesStore.sendMessage({
      sender_id: userId,
      recipient_id: composeForm.value.recipient_id,
      content: composeForm.value.content
    })

    await messagesStore.fetchMessages(userId, 'all')
    showCompose.value = false
    composeForm.value = { recipient_id: '', content: '' }
  } catch (e: any) {
    composeError.value = e.message || 'Failed to send message'
  } finally {
    composeLoading.value = false
  }
}

const viewMessage = async (messageId: string) => {
  try {
    await messagesStore.markAsRead(messageId)
  } catch (error) {
    console.error('Error marking message as read:', error)
  }
}

const getSenderName = (senderId: string) => {
  const profile = profiles.value.find(p => p.id === senderId)
  return profile ? profile.full_name : senderId
}

const getRecipientName = (recipientId: string) => {
  const profile = profiles.value.find(p => p.id === recipientId)
  return profile ? profile.full_name : recipientId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
}

const handleComposeClick = async () => {
  showCompose.value = true
  // Refresh profiles when opening compose modal
  if (profiles.value.length === 0) {
    await fetchProfiles()
  }
}
</script>
