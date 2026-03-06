<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="close" />
        <div
          :class="[
            'relative bg-white rounded-lg shadow-lg w-full flex flex-col max-h-[90vh]',
            sizeClass,
          ]"
          @keydown.esc="close"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 class="text-base font-semibold text-gray-900">{{ title }}</h2>
            <button type="button" class="text-gray-400 hover:text-gray-600 p-1" @click="close">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="overflow-y-auto p-6 flex-1">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ modelValue: boolean; title: string; size?: 'sm' | 'md' | 'lg' }>(),
  { size: 'md' },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const sizeClass = computed(() => ({ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[props.size]))

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
