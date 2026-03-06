<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 class="text-base font-semibold text-gray-900">My Bookings</h1>
        <button v-if="customerStore.isAuthenticated" type="button" class="text-sm text-red-600 hover:underline" @click="customerStore.logout()">
          Sign out
        </button>
      </div>
    </header>
    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCustomerStore } from '@/stores/customer'
const customerStore = useCustomerStore()
</script>
