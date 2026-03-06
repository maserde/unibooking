<template>
  <div class="w-full">
    <label v-if="label" :for="textareaId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <textarea
      :id="textareaId"
      :value="modelValue"
      :rows="rows"
      :class="[
        'block w-full rounded-md border text-sm shadow-sm focus:outline-none focus:ring-1 px-3 py-2',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      ]"
      v-bind="$attrs"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{ modelValue?: string; label?: string; error?: string; rows?: number; id?: string }>(),
  { rows: 3 },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const textareaId = props.id ?? `textarea-${Math.random().toString(36).slice(2, 7)}`
</script>
