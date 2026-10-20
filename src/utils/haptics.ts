/**
 * Haptic Vibration Feedback Helper
 * Uses native Web API `navigator.vibrate` for responsive mobile feedback
 */

export type HapticType = 'light' | 'medium' | 'success' | 'warning' | 'error';

export function triggerHaptic(type: HapticType = 'light', enabled = true): boolean {
  if (!enabled) return false;
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }

  try {
    switch (type) {
      case 'light':
        return navigator.vibrate(15);
      case 'medium':
        return navigator.vibrate(30);
      case 'success':
        return navigator.vibrate([20, 40, 30]);
      case 'warning':
        return navigator.vibrate([40, 60, 40]);
      case 'error':
        return navigator.vibrate([50, 100, 50, 100, 50]);
      default:
        return navigator.vibrate(20);
    }
  } catch {
    return false;
  }
}

export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
}
