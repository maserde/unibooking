<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="inputId"
        v-bind="$attrs"
        :type="showPassword ? 'text' : type"
        :value="modelValue"
        :class="[
          'block w-full rounded-md border text-sm shadow-sm focus:outline-none focus:ring-1 px-3 py-2',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
          type === 'password' ? 'pr-10' : '',
        ]"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        @click="showPassword = !showPassword"
      >
        <span class="text-xs">{{ showPassword ? 'Hide' : 'Show' }}</span>
      </button>
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    type?: string
    error?: string
    hint?: string
    id?: string
  }>(),
  { type: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const showPassword = ref(false)
const inputId = props.id ?? `input-${Math.random().toString(36).slice(2, 7)}`
</script>
