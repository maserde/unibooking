<template>
  <div class="text-center">
    <AppSpinner v-if="loading" class="mx-auto mb-4" />
    <template v-else-if="success">
      <div class="text-green-600 text-4xl mb-3">✓</div>
      <h3 class="font-semibold text-gray-900">Email terverifikasi!</h3>
      <p class="text-sm text-gray-500 mt-1">Email Anda telah diverifikasi.</p>
      <RouterLink to="/login" class="mt-4 inline-block text-sm text-primary-600 hover:underline">Masuk</RouterLink>
    </template>
    <template v-else>
      <div class="text-red-500 text-4xl mb-3">✗</div>
      <h3 class="font-semibold text-gray-900">Verifikasi gagal</h3>
      <p class="text-sm text-gray-500 mt-1">{{ errorMsg }}</p>
      <RouterLink to="/login" class="mt-4 inline-block text-sm text-primary-600 hover:underline">Kembali ke login</RouterLink>
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
  if (!token) { loading.value = false; errorMsg.value = 'Link verifikasi tidak valid'; return }
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
