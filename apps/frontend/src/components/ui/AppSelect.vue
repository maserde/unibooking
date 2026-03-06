<template>
  <div class="w-full">
    <label v-if="label" :for="selectId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      :class="[
        'block w-full rounded-md border text-sm shadow-sm focus:outline-none focus:ring-1 px-3 py-2 bg-white',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      ]"
      v-bind="$attrs"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    options: { value: string; label: string }[]
    error?: string
    placeholder?: string
    id?: string
  }>(),
  {},
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const selectId = props.id ?? `select-${Math.random().toString(36).slice(2, 7)}`
</script>
