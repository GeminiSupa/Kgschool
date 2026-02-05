<template>
  <div>
    <div class="ios-page-header mb-6">
      <h1>Mittagessen-Menü erstellen</h1>
    </div>
    
    <IOSCard customClass="max-w-2xl p-6">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-group-fiori">
          <label for="date" class="form-label-fiori form-label-fiori-required">
            Datum
          </label>
          <input
            id="date"
            v-model="form.date"
            type="date"
            required
            class="ios-input"
          />
        </div>

        <div class="form-group-fiori">
          <label for="meal_name" class="form-label-fiori form-label-fiori-required">
            Gerichtname
          </label>
          <input
            id="meal_name"
            v-model="form.meal_name"
            type="text"
            required
            class="ios-input"
            placeholder="z.B. Gemüse-Pasta"
          />
        </div>

        <div class="form-group-fiori">
          <label for="description" class="form-label-fiori">
            Beschreibung
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="ios-input"
            placeholder="Gerichtbeschreibung..."
          />
        </div>

        <div class="form-group-fiori">
          <label for="allergens" class="form-label-fiori">
            Allergene (kommagetrennt)
          </label>
          <input
            id="allergens"
            v-model="allergensInput"
            type="text"
            class="ios-input"
            placeholder="z.B. Nüsse, Milchprodukte"
          />
        </div>

        <div v-if="error" class="alert-fiori alert-fiori-error">
          {{ error }}
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <NuxtLink
            to="/admin/lunch/menus"
            class="btn-fiori-secondary"
          >
            Abbrechen
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
                  class="ios-button ios-button-primary"
          >
            {{ loading ? 'Wird erstellt...' : 'Menü erstellen' }}
          </button>
        </div>
      </form>
    </IOSCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLunchStore } from '~/stores/lunch'
import { useKita } from '~/composables/useKita'
import Heading from '~/components/ui/Heading.vue'
import IOSCard from '~/components/ui/IOSCard.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: ['admin', 'kitchen']
})

const router = useRouter()
const lunchStore = useLunchStore()

const loading = ref(false)
const error = ref('')
const allergensInput = ref('')

const form = ref({
  date: new Date().toISOString().split('T')[0],
  meal_name: '',
  description: '',
  allergens: [] as string[],
  nutritional_info: {}
})

const { getUserKitaId } = useKita()

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    form.value.allergens = allergensInput.value
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)

    // Add kita_id if available
    const kitaId = await getUserKitaId()
    if (kitaId) {
      (form.value as any).kita_id = kitaId
    }

    await lunchStore.createMenu(form.value)
    await router.push('/admin/lunch/menus')
  } catch (e: any) {
    error.value = e.message || 'Failed to create menu'
  } finally {
    loading.value = false
  }
}
</script>
