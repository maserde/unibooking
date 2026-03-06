<template>
  <div :class="['flex items-start gap-3 rounded-md p-4', bgClass]">
    <div class="flex-1 text-sm" :class="textClass">{{ message }}</div>
    <button v-if="dismissible" type="button" :class="['text-sm font-medium hover:underline', textClass]" @click="emit('dismiss')">
      Dismiss
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ type?: 'error' | 'success' | 'warning' | 'info'; message: string; dismissible?: boolean }>(),
  { type: 'info', dismissible: false },
)

const emit = defineEmits<{ dismiss: [] }>()

const bgClass = computed(
  () =>
    ({ error: 'bg-red-50', success: 'bg-green-50', warning: 'bg-yellow-50', info: 'bg-blue-50' })[props.type],
)
const textClass = computed(
  () =>
    ({ error: 'text-red-800', success: 'text-green-800', warning: 'text-yellow-800', info: 'text-blue-800' })[
      props.type
    ],
)
</script>
