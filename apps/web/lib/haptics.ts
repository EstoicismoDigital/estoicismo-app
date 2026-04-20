/**
 * Haptic feedback helpers backed by the Vibration API.
 *
 * - Android Chrome / Firefox: real vibration.
 * - iOS Safari: currently has no haptic API for web apps — these calls
 *   are silent no-ops. When Apple ships one we swap the implementation
 *   here without touching callers.
 * - SSR and reduced-motion: no-op.
 *
 * The patterns below are intentionally short. Habit completion fires
 * dozens of times per week, so anything over ~40ms starts to feel
 * intrusive rather than confirming.
 */

function canVibrate(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return false;
  }
  // Respect the OS-level reduced-motion preference. Users who opt out of
  // animation almost certainly don't want a buzzing phone either.
  try {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return false;
  } catch {
    // matchMedia can throw on some very old environments — treat as OK.
  }
  return true;
}

function safeVibrate(pattern: number | number[]): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // The Vibration API can throw in some cross-origin iframe setups;
    // ignore — a failed haptic is never worth breaking the UI.
  }
}

/** Tap confirmation — fires when the user marks a habit done. */
export function hapticTap(): void {
  safeVibrate(12);
}

/** Soft bump — fires on unmark/revert. Slightly shorter than a tap so
 * the two states feel distinct through a pocket. */
export function hapticSoftBump(): void {
  safeVibrate(8);
}

/** Celebration pulse — reserved for streak milestones and "day complete"
 * moments. Two short pulses feel like a "nice" rather than a "ping". */
export function hapticCelebrate(): void {
  safeVibrate([18, 40, 18]);
}
