<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

    <div v-if="success" class="text-center py-4">
      <div class="text-green-600 text-4xl mb-3">✓</div>
      <h3 class="font-medium text-gray-900">Check your email</h3>
      <p class="text-sm text-gray-500 mt-1">We sent a verification link to {{ form.email }}</p>
    </div>

    <template v-else>
      <AppAlert v-if="errorMsg" type="error" :message="errorMsg" class="mb-4" />
      <form class="space-y-4" @submit.prevent="handleRegister">
        <AppInput v-model="form.full_name" label="Full name" autocomplete="name" :error="errors.full_name" />
        <AppInput v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" />
        <AppInput v-model="form.password" label="Password" type="password" autocomplete="new-password" hint="At least 8 characters" :error="errors.password" />
        <AppButton type="submit" class="w-full" :loading="loading">Create account</AppButton>
      </form>
      <p class="mt-4 text-sm text-center text-gray-600">
        Already have an account?
        <RouterLink to="/login" class="text-primary-600 hover:underline">Sign in</RouterLink>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/composables/useApiError'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const authStore = useAuthStore()
const { extractError } = useApiError()

const form = reactive({ full_name: '', email: '', password: '' })
const errors = reactive({ full_name: '', email: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')
const success = ref(false)

async function handleRegister() {
  errors.full_name = ''
  errors.email = ''
  errors.password = ''
  errorMsg.value = ''

  if (!form.full_name) { errors.full_name = 'Name is required'; return }
  if (!form.email) { errors.email = 'Email is required'; return }
  if (form.password.length < 8) { errors.password = 'Password must be at least 8 characters'; return }

  loading.value = true
  try {
    await authStore.register(form)
    success.value = true
  } catch (e) {
    errorMsg.value = extractError(e)
  } finally {
    loading.value = false
  }
}
</script>
