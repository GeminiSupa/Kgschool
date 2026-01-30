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
        @click="showCompose = true"
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
            <select
              v-model="composeForm.recipient_id"
              required
              :disabled="profilesLoading"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{{ profilesLoading ? 'Loading...' : 'Select recipient' }}</option>
              <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
                {{ profile.full_name }} ({{ profile.role }})
              </option>
            </select>
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
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              @click="showCompose = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="sending"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {{ sending ? 'Sending...' : 'Send' }}
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
import { useMessagesStore } from '~/stores/messages'
import { useAuthStore } from '~/stores/auth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: 'support'
})

const supabase = useSupabaseClient()
const messagesStore = useMessagesStore()
const authStore = useAuthStore()

const { messages, loading, error } = storeToRefs(messagesStore)
const activeTab = ref<'inbox' | 'outbox'>('inbox')
const showCompose = ref(false)
const profiles = ref<any[]>([])
const profilesLoading = ref(true)
const sending = ref(false)
const composeError = ref('')

const composeForm = ref({
  recipient_id: '',
  content: ''
})

const displayMessages = computed(() => {
  if (!authStore.user?.id) return []
  if (activeTab.value === 'inbox') {
    return messages.value.filter(m => m.recipient_id === authStore.user?.id)
  } else {
    return messages.value.filter(m => m.sender_id === authStore.user?.id)
  }
})

const unreadCount = computed(() => {
  if (!authStore.user?.id) return 0
  return messages.value.filter(m => m.recipient_id === authStore.user?.id && !m.read_at).length
})

onMounted(async () => {
  try {
    if (authStore.user?.id) {
      await Promise.all([
        messagesStore.fetchMessages(authStore.user.id, 'all'),
        fetchProfiles()
      ])
    }
  } catch (e: any) {
    console.error('Error loading messages:', e)
  }
})

const fetchProfiles = async () => {
  try {
    profilesLoading.value = true
    // Support staff can message parents, teachers, admins, and kitchen staff
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['parent', 'teacher', 'admin', 'kitchen'])
      .order('full_name')

    if (fetchError) throw fetchError
    profiles.value = data || []
  } catch (e: any) {
    console.error('Error fetching profiles:', e)
  } finally {
    profilesLoading.value = false
  }
}

const sendMessage = async () => {
  if (!authStore.user?.id) return

  sending.value = true
  composeError.value = ''

  try {
    await messagesStore.sendMessage({
      sender_id: authStore.user.id,
      recipient_id: composeForm.value.recipient_id,
      content: composeForm.value.content
    })

    showCompose.value = false
    composeForm.value = { recipient_id: '', content: '' }
    await messagesStore.fetchMessages(authStore.user.id, 'all')
  } catch (e: any) {
    composeError.value = e.message || 'Failed to send message'
  } finally {
    sending.value = false
  }
}

const viewMessage = async (messageId: string) => {
  try {
    const message = messages.value.find(m => m.id === messageId)
    if (message && !message.read_at && message.recipient_id === authStore.user?.id) {
      await messagesStore.markAsRead(messageId)
    }
    // Navigate to message detail or show in modal
  } catch (e: any) {
    console.error('Error viewing message:', e)
  }
}

const getSenderName = (senderId: string) => {
  const profile = profiles.value.find(p => p.id === senderId)
  return profile?.full_name || senderId
}

const getRecipientName = (recipientId: string) => {
  const profile = profiles.value.find(p => p.id === recipientId)
  return profile?.full_name || recipientId
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}
</script>
