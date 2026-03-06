import { useUiStore } from '@/stores/ui'
import type { Toast } from '@/stores/ui'

export function useToast() {
  const uiStore = useUiStore()

  function success(message: string) { uiStore.toast('success', message) }
  function error(message: string) { uiStore.toast('error', message) }
  function warning(message: string) { uiStore.toast('warning', message) }
  function info(message: string) { uiStore.toast('info', message) }

  return { success, error, warning, info, toast: uiStore.toast }
}

export type { Toast }
