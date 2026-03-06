<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <template v-if="loading">
          <tr v-for="i in 5" :key="i">
            <td v-for="col in columns" :key="col.key" class="px-6 py-4">
              <div class="h-4 bg-gray-200 rounded animate-pulse" />
            </td>
          </tr>
        </template>
        <template v-else-if="rows.length === 0">
          <tr>
            <td :colspan="columns.length" class="px-6 py-12 text-center">
              <slot name="empty">
                <p class="text-sm text-gray-500">No records found</p>
              </slot>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr
            v-for="(row, idx) in rows"
            :key="idx"
            :class="clickable ? 'hover:bg-gray-50 cursor-pointer' : ''"
            @click="clickable && emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  columns: { key: string; label: string }[]
  rows: Record<string, unknown>[]
  loading?: boolean
  clickable?: boolean
}>()

const emit = defineEmits<{ 'row-click': [row: Record<string, unknown>] }>()
</script>
