<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-6">Masuk ke akun Anda</h2>
    <AppAlert v-if="errorMsg" type="error" :message="errorMsg" class="mb-4" />
    <form class="space-y-4" @submit.prevent="handleLogin">
      <AppInput v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" />
      <AppInput v-model="form.password" label="Kata Sandi" type="password" autocomplete="current-password" :error="errors.password" />
      <AppButton type="submit" class="w-full" :loading="loading">Masuk</AppButton>
    </form>
    <p class="mt-4 text-sm text-center text-gray-600">
      Belum punya akun?
      <RouterLink to="/register" class="text-primary-600 hover:underline">Daftar</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/composables/useApiError'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const authStore = useAuthStore()
const router = useRouter()
const { extractError } = useApiError()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errors.email = ''
  errors.password = ''
  errorMsg.value = ''
  if (!form.email) { errors.email = 'Email wajib diisi'; return }
  if (!form.password) { errors.password = 'Kata sandi wajib diisi'; return }

  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    router.push(authStore.needsOnboarding ? '/onboarding' : '/dashboard')
  } catch (e) {
    errorMsg.value = extractError(e)
  } finally {
    loading.value = false
  }
}
</script>
