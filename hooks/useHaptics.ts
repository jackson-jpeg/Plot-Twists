/**
 * Haptic feedback helpers.
 *
 * With Capacitor removed, these are no-ops. The native SwiftUI app handles
 * its own haptics. Web browsers don't support haptic feedback.
 */

/** Light impact for button taps */
export async function tapHaptic() {}

/** Notification success feedback */
export async function successHaptic() {}

/** Notification error feedback */
export async function errorHaptic() {}
