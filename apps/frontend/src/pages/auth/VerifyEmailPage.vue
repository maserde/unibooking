<template>
  <div class="text-center">
    <AppSpinner v-if="loading" class="mx-auto mb-4" />
    <template v-else-if="success">
      <div class="text-green-600 text-4xl mb-3">✓</div>
      <h3 class="font-semibold text-gray-900">Email verified!</h3>
      <p class="text-sm text-gray-500 mt-1">Your email has been verified.</p>
      <RouterLink to="/login" class="mt-4 inline-block text-sm text-primary-600 hover:underline">Sign in</RouterLink>
    </template>
    <template v-else>
      <div class="text-red-500 text-4xl mb-3">✗</div>
      <h3 class="font-semibold text-gray-900">Verification failed</h3>
      <p class="text-sm text-gray-500 mt-1">{{ errorMsg }}</p>
      <RouterLink to="/login" class="mt-4 inline-block text-sm text-primary-600 hover:underline">Back to login</RouterLink>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authApi } from '@/api/auth'
import { useApiError } from '@/composables/useApiError'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const route = useRoute()
const { extractError } = useApiError()

const loading = ref(true)
const success = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  const token = route.query.token as string
  if (!token) { loading.value = false; errorMsg.value = 'Invalid verification link'; return }
  try {
    await authApi.verifyEmail(token)
    success.value = true
  } catch (e) {
    errorMsg.value = extractError(e)
  } finally {
    loading.value = false
  }
})
</script>
