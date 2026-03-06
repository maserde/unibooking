<template>
  <div class="bg-white border border-gray-200 rounded-lg">
    <div v-if="title || $slots.action" class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h3 v-if="title" class="text-base font-semibold text-gray-900">{{ title }}</h3>
      <slot name="action" />
    </div>
    <div :class="noPadding ? '' : 'p-6'">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title?: string; noPadding?: boolean }>(), { noPadding: false })
</script>
