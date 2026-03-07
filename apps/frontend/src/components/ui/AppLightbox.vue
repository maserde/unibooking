<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="modelValue !== null"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        role="dialog"
        aria-modal="true"
        @click.self="close"
      >
        <button class="lightbox-btn top-4 right-4" aria-label="Close" @click="close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          v-if="hasPrev"
          class="lightbox-btn left-4"
          aria-label="Previous image"
          @click="navigate(-1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <img
          :src="current.url"
          :alt="current.alt ?? ''"
          class="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        />

        <button
          v-if="hasNext"
          class="lightbox-btn right-4"
          aria-label="Next image"
          @click="navigate(1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div v-if="images.length > 1" class="absolute bottom-4 flex gap-2" role="tablist">
          <button
            v-for="(_, i) in images"
            :key="i"
            role="tab"
            :aria-selected="i === modelValue"
            :aria-label="`Image ${i + 1}`"
            :class="['w-2 h-2 rounded-full transition-colors', i === modelValue ? 'bg-white' : 'bg-white/40']"
            @click="emit('update:modelValue', i)"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

export interface LightboxImage {
  url: string
  alt?: string
}

const props = defineProps<{
  modelValue: number | null
  images: LightboxImage[]
}>()

const emit = defineEmits<{ 'update:modelValue': [index: number | null] }>()

const current = computed(() => props.images[props.modelValue ?? 0] ?? { url: '' })
const hasPrev = computed(() => (props.modelValue ?? 0) > 0)
const hasNext = computed(() => (props.modelValue ?? 0) < props.images.length - 1)

function close() {
  emit('update:modelValue', null)
}

function navigate(direction: 1 | -1) {
  if (props.modelValue === null) return
  emit('update:modelValue', props.modelValue + direction)
}

function onKeyDown(e: KeyboardEvent) {
  if (props.modelValue === null) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft' && hasPrev.value) navigate(-1)
  else if (e.key === 'ArrowRight' && hasNext.value) navigate(1)
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<style scoped>
.lightbox-btn {
  @apply absolute flex items-center justify-center w-10 h-10 rounded-full
         text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-colors;
}

.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
