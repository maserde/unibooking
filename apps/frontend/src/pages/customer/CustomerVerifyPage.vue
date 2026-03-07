<template>
  <div class="text-center py-16">
    <AppSpinner v-if="loading" class="mx-auto" size="lg" />
    <div v-else-if="success">
      <div class="text-green-500 text-4xl mb-3">✓</div>
      <h3 class="font-semibold text-gray-900">Verified! Redirecting…</h3>
    </div>
    <div v-else>
      <div class="text-red-500 text-4xl mb-3">✗</div>
      <h3 class="font-semibold text-gray-900">Invalid or expired link</h3>
      <RouterLink :to="`/customer/${slug}/login`" class="mt-3 inline-block text-sm text-primary-600 hover:underline">Try again</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomerStore } from '@/stores/customer'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const route = useRoute()
const router = useRouter()
const customerStore = useCustomerStore()
const slug = route.params.slug as string

const loading = ref(true)
const success = ref(false)

onMounted(async () => {
  try {
    await customerStore.verifyToken(route.params.token as string)
    success.value = true
    setTimeout(() => router.push(`/customer/${slug}/bookings`), 1000)
  } catch {
    // handled by success=false
  } finally {
    loading.value = false
  }
})
</script>
