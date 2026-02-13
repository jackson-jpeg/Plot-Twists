import { isCapacitorNative } from '@/lib/platform'

const noop = () => {}

let _haptics: typeof import('@capacitor/haptics') | null = null
const getHaptics = async () => {
  if (!isCapacitorNative()) return null
  if (!_haptics) {
    try {
      _haptics = await import('@capacitor/haptics')
    } catch {
      return null
    }
  }
  return _haptics
}

/** Light impact for button taps */
export async function tapHaptic() {
  const mod = await getHaptics()
  if (!mod) return
  mod.Haptics.impact({ style: mod.ImpactStyle.Light }).catch(noop)
}

/** Notification success feedback */
export async function successHaptic() {
  const mod = await getHaptics()
  if (!mod) return
  mod.Haptics.notification({ type: mod.NotificationType.Success }).catch(noop)
}

/** Notification error feedback */
export async function errorHaptic() {
  const mod = await getHaptics()
  if (!mod) return
  mod.Haptics.notification({ type: mod.NotificationType.Error }).catch(noop)
}
