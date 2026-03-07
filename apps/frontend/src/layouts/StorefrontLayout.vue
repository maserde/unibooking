<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold text-gray-900">{{ merchantName }}</h1>
        </div>
        <RouterLink :to="`/store/${slug}`" class="text-sm text-primary-600 hover:underline">Home</RouterLink>
      </div>
    </header>
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

defineProps<{ merchantName?: string }>()

const route = useRoute()
const slug = route.params.slug as string
</script>
