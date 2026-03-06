<template>
  <svg
    :class="['animate-spin', sizeClass, colorClass]"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ size?: 'sm' | 'md' | 'lg'; color?: string }>(),
  { size: 'md', color: 'text-primary-600' },
)

const sizeClass = computed(() => ({ sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' })[props.size])
const colorClass = computed(() => props.color)
</script>
