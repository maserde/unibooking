<template>
  <div class="text-center py-12">
    <div v-if="icon" class="text-gray-400 text-4xl mb-3">{{ icon }}</div>
    <h3 class="text-sm font-medium text-gray-900">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-sm text-gray-500">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon?: string; title: string; description?: string }>()
</script>
