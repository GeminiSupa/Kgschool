<template>
  <div>
    <Heading size="xl" class="mb-6">Mein Profil</Heading>

    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <div v-else-if="error" class="mb-6">
      <ErrorAlert :message="error" />
    </div>

    <div v-else-if="profile">
      <IOSCard customClass="max-w-2xl p-6">
      <form @submit.prevent="handleUpdate" class="space-y-6">
        <!-- Profile Picture -->
        <div>
          <Heading size="md" class="mb-4">Profilbild</Heading>
          <div class="flex items-center gap-6">
            <div class="relative">
              <div
                v-if="profile.avatar_url"
                class="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200"
              >
                <img
                  :src="profile.avatar_url"
                  :alt="profile.full_name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium border-2 border-gray-200"
              >
                {{ initials }}
              </div>
              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                @change="handleAvatarChange"
                class="hidden"
              />
            </div>
            <div class="flex-1">
              <button
                type="button"
                @click="avatarInput?.click()"
                :disabled="uploadingAvatar"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {{ uploadingAvatar ? 'Wird hochgeladen...' : 'Bild ändern' }}
              </button>
              <p class="text-xs text-gray-500 mt-2">
                JPG, PNG oder GIF. Max. Größe 2MB.
              </p>
              <button
                v-if="profile.avatar_url"
                type="button"
                @click="removeAvatar"
                :disabled="uploadingAvatar"
                class="mt-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Bild entfernen
              </button>
            </div>
          </div>
          <div v-if="avatarError" class="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-sm">
            {{ avatarError }}
          </div>
        </div>

        <!-- Profile Information -->
        <div class="pt-6 border-t">
          <Heading size="md" class="mb-4">Profilinformationen</Heading>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Vollständiger Name *
              </label>
              <input
                v-model="form.full_name"
                type="text"
                required
                class="ios-input"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                :value="profile.email"
                type="email"
                disabled
                class="ios-input"
              />
              <p class="text-xs text-gray-500 mt-1">E-Mail kann nicht geändert werden</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                v-model="form.phone"
                type="tel"
                class="ios-input"
                placeholder="+49 123 456 7890"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Rolle
              </label>
              <input
                :value="profile.role"
                type="text"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed capitalize"
              />
              <p class="text-xs text-gray-500 mt-1">Rolle kann nicht geändert werden</p>
            </div>
          </div>
        </div>

        <!-- Change Password -->
        <div class="pt-6 border-t">
          <Heading size="md" class="mb-4">Passwort ändern</Heading>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Neues Passwort *
              </label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                class="ios-input"
                placeholder="Neues Passwort eingeben"
                :disabled="changingPassword"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Neues Passwort bestätigen *
              </label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                class="ios-input"
                placeholder="Neues Passwort bestätigen"
                :disabled="changingPassword"
              />
            </div>
            <div v-if="passwordError" class="p-2 bg-red-50 text-red-700 rounded-md text-sm">
              {{ passwordError }}
            </div>
            <div v-if="passwordSuccess" class="p-2 bg-green-50 text-green-700 rounded-md text-sm">
              Passwort erfolgreich geändert!
            </div>
            <button
              type="button"
              @click="handleChangePassword"
              :disabled="changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword"
              class="ios-button ios-button-primary disabled:opacity-50"
            >
              {{ changingPassword ? 'Wird geändert...' : 'Passwort ändern' }}
            </button>
          </div>
        </div>

        <!-- Account Information -->
        <div class="pt-6 border-t">
          <Heading size="md" class="mb-4">Kontoinformationen</Heading>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Benutzer-ID
              </label>
              <input
                :value="profile.id"
                type="text"
                disabled
                class="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed font-mono text-sm"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Erstellt am
                </label>
                <input
                  :value="formatDate(profile.created_at)"
                  type="text"
                  disabled
                  class="ios-input"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Zuletzt aktualisiert
                </label>
                <input
                  :value="formatDate(profile.updated_at)"
                  type="text"
                  disabled
                  class="ios-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="updateError" class="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ updateError }}
        </div>

        <!-- Success Message -->
        <div v-if="updateSuccess" class="p-3 bg-green-50 text-green-700 rounded-md text-sm">
          Profil erfolgreich aktualisiert!
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <NuxtLink
            to="/"
            class="ios-button ios-button-secondary"
          >
            Abbrechen
          </NuxtLink>
          <button
            type="submit"
            :disabled="updating"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ updating ? 'Wird gespeichert...' : 'Änderungen speichern' }}
          </button>
        </div>
      </form>
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
  return new Date(date).toLocaleString()
}
</script>
