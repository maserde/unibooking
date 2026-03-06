<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <TransitionGroup name="toast">
        <div
          v-for="t in uiStore.toasts"
          :key="t.id"
          :class="['flex items-start gap-3 rounded-lg border p-4 shadow-md bg-white', borderClass(t.type)]"
        >
          <div class="flex-1">
            <p :class="['text-sm font-medium', textClass(t.type)]">{{ t.message }}</p>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 flex-shrink-0" @click="uiStore.dismiss(t.id)">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import type { Toast } from '@/stores/ui'

const uiStore = useUiStore()

function borderClass(type: Toast['type']): string {
  return { success: 'border-green-200', error: 'border-red-200', warning: 'border-yellow-200', info: 'border-blue-200' }[type]
}

function textClass(type: Toast['type']): string {
  return { success: 'text-green-800', error: 'text-red-800', warning: 'text-yellow-800', info: 'text-blue-800' }[type]
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
