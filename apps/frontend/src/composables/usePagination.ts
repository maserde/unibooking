import { ref, computed } from 'vue'

export function usePagination(defaultLimit = 20) {
  const page = ref(1)
  const limit = ref(defaultLimit)
  const total = ref(0)

  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

  function reset() {
    page.value = 1
  }

  return { page, limit, total, pageCount, reset }
}
