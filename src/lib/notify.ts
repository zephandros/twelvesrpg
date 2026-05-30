import { toast } from 'sonner'

export type NotifyType = 'error' | 'success' | 'info'

// Phase 5: swap this implementation to check Capacitor.isNativePlatform()
// and call @capacitor/toast for native Android/iOS toasts.
export function notify(message: string, type: NotifyType = 'error'): void {
  toast[type](message)
}
