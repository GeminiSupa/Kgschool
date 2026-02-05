<template>
  <div>
    <div class="mb-6">
      <Heading size="xl" class="mb-1">Mein Profil</Heading>
      <p class="text-sm text-gray-500">Verwalten Sie Ihre persönlichen Informationen und Kontoeinstellungen</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="profile" class="space-y-6">
      <!-- Profile Picture Card -->
      <IOSCard customClass="p-6">
        <Heading size="md" class="mb-6">Profilbild</Heading>
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div class="relative">
            <div
              v-if="profile.avatar_url"
              class="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-200"
            >
              <img
                :src="profile.avatar_url"
                :alt="profile.full_name"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg ring-2 ring-gray-200"
            >
              {{ initials }}
            </div>
            <div
              v-if="uploadingAvatar"
              class="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              @change="handleAvatarChange"
              class="hidden"
            />
          </div>
          <div class="flex-1 w-full sm:w-auto">
            <button
              type="button"
              @click="avatarInput?.click()"
              :disabled="uploadingAvatar"
              class="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {{ uploadingAvatar ? '⏳ Wird hochgeladen...' : '📷 Bild ändern' }}
            </button>
            <p class="text-xs text-gray-500 mt-3">
              JPG, PNG oder GIF. Max. Größe 2MB.
            </p>
            <button
              v-if="profile.avatar_url"
              type="button"
              @click="removeAvatar"
              :disabled="uploadingAvatar"
              class="mt-3 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
            >
              🗑️ Bild entfernen
            </button>
          </div>
        </div>
        <div v-if="avatarError" class="mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">
          <div class="font-semibold mb-1">⚠️ Upload Fehler:</div>
          {{ avatarError }}
        </div>
      </IOSCard>

      <!-- Profile Information Card -->
      <IOSCard customClass="p-6">
        <form @submit.prevent="handleUpdate" class="space-y-6">
        <Heading size="md" class="mb-6">Profilinformationen</Heading>

        
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Vollständiger Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.full_name"
                type="text"
                required
                class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Ihr vollständiger Name"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                E-Mail
              </label>
              <input
                :value="profile.email"
                type="email"
                disabled
                class="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed"
              />
              <p class="text-xs text-gray-500 mt-2">E-Mail kann nicht geändert werden</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Telefon
              </label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="+49 123 456 7890"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Rolle
              </label>
              <div class="relative">
                <input
                  :value="formatRole(profile.role)"
                  type="text"
                  disabled
                  class="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed capitalize"
                />
                <span
                  :class="[
                    'absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded-full',
                    profile.role === 'admin' ? 'bg-purple-500 text-white' :
                    profile.role === 'teacher' ? 'bg-blue-500 text-white' :
                    profile.role === 'parent' ? 'bg-green-500 text-white' :
                    'bg-gray-500 text-white'
                  ]"
                >
                  {{ profile.role }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-2">Rolle kann nicht geändert werden</p>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="updateError" class="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">
            ⚠️ {{ updateError }}
          </div>

          <!-- Success Message -->
          <div v-if="updateSuccess" class="p-4 bg-green-50 border-2 border-green-200 text-green-800 rounded-xl text-sm">
            ✅ Profil erfolgreich aktualisiert!
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              :disabled="updating"
              class="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {{ updating ? '⏳ Wird gespeichert...' : '✅ Änderungen speichern' }}
            </button>
          </div>
        </form>
      </IOSCard>

      <!-- Change Password Card -->
      <IOSCard customClass="p-6">
        <Heading size="md" class="mb-6">Passwort ändern</Heading>
        
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Neues Passwort <span class="text-red-500">*</span>
            </label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Neues Passwort eingeben"
              :disabled="changingPassword"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Neues Passwort bestätigen <span class="text-red-500">*</span>
            </label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Neues Passwort bestätigen"
              :disabled="changingPassword"
            />
          </div>
          <div v-if="passwordError" class="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm">
            ⚠️ {{ passwordError }}
          </div>
          <div v-if="passwordSuccess" class="p-4 bg-green-50 border-2 border-green-200 text-green-800 rounded-xl text-sm">
            ✅ Passwort erfolgreich geändert!
          </div>
          <button
            type="button"
            @click="handleChangePassword"
            :disabled="changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword"
            class="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
          >
            {{ changingPassword ? '⏳ Wird geändert...' : '🔒 Passwort ändern' }}
          </button>
        </div>
      </IOSCard>

      <!-- Account Information Card -->
      <IOSCard customClass="p-6">
        <Heading size="md" class="mb-6">Kontoinformationen</Heading>
        
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Benutzer-ID
            </label>
            <input
              :value="profile.id"
              type="text"
              disabled
              class="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed font-mono text-sm"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Erstellt am
              </label>
              <input
                :value="formatDate(profile.created_at)"
                type="text"
                disabled
                class="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Zuletzt aktualisiert
              </label>
              <input
                :value="formatDate(profile.updated_at)"
                type="text"
                disabled
                class="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/useAuth'
import Heading from '~/components/ui/Heading.vue'
import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
import ErrorAlert from '~/components/common/ErrorAlert.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth']
})

const authStore = useAuthStore()
const { updateProfile, changePassword, uploadAvatar, removeAvatar: removeAvatarFromStorage } = useAuth()

const loading = ref(true)
const error = ref('')
const profile = ref<any>(null)
const updating = ref(false)
const updateError = ref('')
const updateSuccess = ref(false)

const form = ref({
  full_name: '',
  phone: ''
})

const avatarInput = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)
const avatarError = ref('')

const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})
const changingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

const initials = computed(() => {
  const name = profile.value?.full_name || ''
  return name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

onMounted(async () => {
  try {
    // Ensure user is loaded first
    const supabase = useSupabaseClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      error.value = 'Nicht authentifiziert. Bitte melden Sie sich erneut an.'
      loading.value = false
      return
    }

    // Set user in store if not already set
    if (!authStore.user) {
      authStore.setUser(currentUser)
    }

    // Fetch profile
    if (!authStore.profile) {
      await authStore.fetchProfile()
    }

    if (authStore.profile) {
      profile.value = authStore.profile
      form.value = {
        full_name: authStore.profile.full_name || '',
        phone: authStore.profile.phone || ''
      }
    } else {
      error.value = 'Profil konnte nicht geladen werden'
    }
  } catch (e: any) {
    console.error('Error loading profile:', e)
    error.value = e.message || 'Profil konnte nicht geladen werden'
  } finally {
    loading.value = false
  }
})

const handleUpdate = async () => {
  updating.value = true
  updateError.value = ''
  updateSuccess.value = false

  try {
    // Validate form
    if (!form.value.full_name || form.value.full_name.trim() === '') {
      updateError.value = 'Vollständiger Name ist erforderlich'
      updating.value = false
      return
    }

    // Ensure user is authenticated
    const supabase = useSupabaseClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      updateError.value = 'Nicht authentifiziert. Bitte melden Sie sich erneut an.'
      updating.value = false
      return
    }

    const updated = await updateProfile({
      full_name: form.value.full_name.trim(),
      phone: form.value.phone?.trim() || null
    })

    // Update local store
    await authStore.fetchProfile()
    profile.value = authStore.profile

    updateSuccess.value = true
    setTimeout(() => {
      updateSuccess.value = false
    }, 3000)
  } catch (e: any) {
    console.error('Update error:', e)
    updateError.value = e.message || 'Profil konnte nicht aktualisiert werden'
  } finally {
    updating.value = false
  }
}

const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingAvatar.value = true
  avatarError.value = ''

  try {
    await uploadAvatar(file)
    // Refresh profile to get new avatar URL
    await authStore.fetchProfile()
    profile.value = authStore.profile
  } catch (e: any) {
    avatarError.value = e.message || 'Avatar konnte nicht hochgeladen werden'
  } finally {
    uploadingAvatar.value = false
    // Reset input
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}

const removeAvatar = async () => {
  uploadingAvatar.value = true
  avatarError.value = ''

  try {
    await removeAvatarFromStorage()
    await authStore.fetchProfile()
    profile.value = authStore.profile
  } catch (e: any) {
    avatarError.value = e.message || 'Avatar konnte nicht entfernt werden'
  } finally {
    uploadingAvatar.value = false
  }
}

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Passwörter stimmen nicht überein'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'Passwort muss mindestens 6 Zeichen lang sein'
    return
  }

  changingPassword.value = true
  passwordError.value = ''
  passwordSuccess.value = false

  try {
    await changePassword(passwordForm.value.newPassword)
    passwordSuccess.value = true
    passwordForm.value = { newPassword: '', confirmPassword: '' }
    setTimeout(() => {
      passwordSuccess.value = false
    }, 3000)
  } catch (e: any) {
    passwordError.value = e.message || 'Passwort konnte nicht geändert werden'
  } finally {
    changingPassword.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    admin: 'Administrator',
    teacher: 'Erzieher/in',
    parent: 'Elternteil',
    kitchen: 'Küche',
    support: 'Support'
  }
  return roles[role] || role
}
</script>
