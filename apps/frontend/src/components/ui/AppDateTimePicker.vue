<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <input
      type="datetime-local"
      :value="modelValue"
      :min="min"
      :class="[
        'block w-full rounded-md border text-sm shadow-sm focus:outline-none focus:ring-1 px-3 py-2',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      ]"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue?: string; label?: string; error?: string; min?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
