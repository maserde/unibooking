<template>
  <div v-if="pageCount > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
    <div class="text-sm text-gray-700">
      Halaman <span class="font-medium">{{ page }}</span> dari <span class="font-medium">{{ pageCount }}</span>
      &nbsp;({{ total }} total)
    </div>
    <div class="flex gap-1">
      <button
        :disabled="page <= 1"
        class="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
        @click="emit('update:page', page - 1)"
      >
        Sebelumnya
      </button>
      <button
        :disabled="page >= pageCount"
        class="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
        @click="emit('update:page', page + 1)"
      >
        Berikutnya
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ page: number; pageCount: number; total: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()
</script>
