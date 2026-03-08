<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 class="text-base font-semibold text-gray-900">Portal Pelanggan</h1>
        <button v-if="customerStore.isAuthenticated" type="button" class="text-sm text-red-600 hover:underline" @click="signOut">
          Keluar        </button>
      </div>
    </header>
    <main class="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCustomerStore } from '@/stores/customer'
import { useRoute, useRouter } from 'vue-router'

const customerStore = useCustomerStore()
const route = useRoute()
const router = useRouter()

function signOut() {
  customerStore.logout()
  const slug = (route.params.slug as string) || localStorage.getItem('last_store_slug')
  router.push(slug ? `/customer/${slug}/login` : '/login')
}
</script>
