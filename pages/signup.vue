<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <IOSCard class="p-8 text-center">
        <div class="mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <span class="text-3xl">🔒</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Kontenerstellung eingeschränkt</h1>
          <p class="text-gray-600">
            Benutzerkonten können aus Sicherheitsgründen nur von Administratoren erstellt werden.
          </p>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-800">
            <strong>Benötigen Sie ein Konto?</strong><br>
            Bitte kontaktieren Sie Ihren Kindergarten-Administrator, um Ihr Konto zu erstellen. Er wird Ihnen die Anmeldedaten zur Verfügung stellen.
          </p>
        </div>

        <div class="space-y-3">
          <IOSButton
            variant="primary"
            size="large"
            class="w-full"
            @click="navigateTo('/login')"
          >
            Zur Anmeldung
          </IOSButton>
          <NuxtLink
            to="/"
            class="block text-center text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Zurück zur Startseite
          </NuxtLink>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import IOSCard from '~/components/ui/IOSCard.vue'
import IOSButton from '~/components/ui/IOSButton.vue'

// Use auth layout (no sidebar/header)
definePageMeta({
  layout: 'auth'
})
</script>
