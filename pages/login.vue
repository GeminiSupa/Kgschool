<template>
          <div class="login-page min-h-screen flex items-center justify-center p-4 relative overflow-hidden ios-background">
    
    <!-- Login Card -->
    <div class="login-container relative z-10 w-full max-w-md">
      <IOSCard class="p-8 md:p-10">
        <!-- Logo/Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">🎓</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            KG School
          </h1>
          <p class="text-gray-600 text-sm md:text-base">Kindergarten Management System</p>
        </div>
        
        <form @submit.prevent.stop="handleLogin" method="post" class="space-y-5" novalidate>
          <IOSInput
            id="email"
            v-model="email"
            label="E-Mail"
            type="email"
            placeholder="Geben Sie Ihre E-Mail ein"
            required
            :error="error && error.includes('email') ? error : undefined"
          />

          <IOSInput
            id="password"
            v-model="password"
            label="Passwort"
            type="password"
            placeholder="Geben Sie Ihr Passwort ein"
            required
            :error="error && error.includes('password') ? error : undefined"
          />

          <IOSButton
            type="button"
            :disabled="loading"
            variant="primary"
            size="large"
            class="w-full mt-6"
            @click="handleLogin($event)"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="ios-spinner"></span>
              Wird angemeldet...
            </span>
            <span v-else>Anmelden</span>
          </IOSButton>

          <div v-if="error && !error.includes('email') && !error.includes('password')" 
               class="ios-error-alert">
            <span class="ios-error-icon">⚠️</span>
            <span>{{ error }}</span>
          </div>
        </form>

        <div class="mt-8 text-center">
          <NuxtLink to="/" class="ios-link">
            ← Zurück zur Startseite
          </NuxtLink>
        </div>
      </IOSCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useRouter } from 'vue-router'
import IOSCard from '~/components/ui/IOSCard.vue'
import IOSButton from '~/components/ui/IOSButton.vue'
import IOSInput from '~/components/ui/IOSInput.vue'

// Use auth layout (no sidebar/header)
definePageMeta({
  layout: 'auth',
  // Disable i18n on login page to avoid loading issues
  keepalive: false
})

const supabase = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async (event?: Event | MouseEvent) => {
  console.log('handleLogin called', { event, email: email.value, hasPassword: !!password.value })
  
  // Prevent any default form submission
  if (event) {
    event.preventDefault()
    event.stopPropagation()
    if ('stopImmediatePropagation' in event) {
      event.stopImmediatePropagation()
    }
  }
  
  // Prevent double submission
  if (loading.value) {
    console.log('Login already in progress, ignoring duplicate request')
    return
  }
  
  // Validate inputs
  if (!email.value || !email.value.trim()) {
    error.value = 'Email is required'
    console.log('Validation failed: Email required')
    return
  }
  
  if (!password.value) {
    error.value = 'Password is required'
    console.log('Validation failed: Password required')
    return
  }
  
  loading.value = true
  error.value = ''
  console.log('Starting login process...')

  try {
    console.log('Login attempt started for:', email.value.trim())
    
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    })

    if (err) {
      console.error('Login error from Supabase:', err)
      error.value = err.message || 'Invalid email or password'
      loading.value = false
      return
    }

    if (!data || !data.session) {
      console.error('No session in response')
      error.value = 'Login failed: No session returned'
      loading.value = false
      return
    }

    console.log('Login successful, session received:', data.session.user.id)

    // Wait for session to be established and persisted
    await new Promise(resolve => setTimeout(resolve, 800))

    // Verify session is actually available before redirecting
    const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession()
    
    if (verifyError || !verifySession?.user) {
      console.error('Login - Session verification failed:', verifyError)
      error.value = 'Session could not be established. Please try again.'
      loading.value = false
      return
    }

    console.log('Login - Session verified, redirecting to callback')

    // Use window.location for more reliable redirect
    window.location.href = '/auth/callback'
  } catch (e: any) {
    console.error('Login error:', e)
    error.value = e.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.login-container {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ios-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ios-error-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 59, 48, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 12px;
  color: #ff3b30;
  font-size: 14px;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.ios-error-icon {
  font-size: 18px;
}

.ios-link {
  color: #6e6e73;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-block;
}

.ios-link:hover {
  color: #1d1d1f;
  transform: translateX(-3px);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .login-page {
    padding: 16px;
  }
  
  .login-container {
    max-width: 100%;
  }
}

/* iOS safe area support */
@supports (padding: max(0px)) {
  .login-page {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}
</style>
