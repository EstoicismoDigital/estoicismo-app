/**
 * In-tab habit reminders via the browser Notification API.
 *
 * Scope / limitations:
 *   - Fires only while a tab is open. No service worker / Push API yet —
 *     that's a future add for background delivery. For active users this
 *     is already parity with Daily Planner's web reminder behavior.
 *   - Suppression of re-fires across reloads is per-habit-per-day via
 *     localStorage, keyed by the user's local date.
 *   - iOS Safari: Notification API is supported (iOS 16.4+) but only from
 *     a home-screen-installed PWA. In a regular Safari tab it's a no-op.
 *     `isSupported()` reflects the runtime fact rather than the platform,
 *     so callers don't need to branch per-OS.
 *
 * This module is split between SSR-safe pure helpers (exported for the
 * hook AND for tests) and side-effect helpers that touch the browser.
 * The pure `shouldFire` decision function is intentionally free of Date
 * and localStorage so it stays trivially unit-testable.
 */
import type { Habit } from "@estoicismo/supabase";
import { isHabitDueOn } from "../components/habits/TodayTimeline";

const FIRED_KEY_PREFIX = "estoicismo:reminder-fired:";

export type PermissionState = "granted" | "denied" | "default" | "unsupported";

/** True if the current runtime can show browser notifications. */
export function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
}

/** Current permission state, or "unsupported" when Notification is absent. */
export function getPermission(): PermissionState {
  if (!isSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Request notification permission. Must be invoked from a user gesture
 * (e.g. a button click) or browsers will reject silently with "default".
 */
export async function requestPermission(): Promise<PermissionState> {
  if (!isSupported()) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    // Older Safari returns via callback, not promise — we swallow and
    // return "denied" rather than reject; the UI re-queries getPermission
    // on its next render and settles on whatever actually happened.
    return "denied";
  }
}

/** "HH:MM" from a Date, zero-padded for safe lexical compare. */
export function formatHM(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Coerce a reminder_time value down to "HH:MM".
 * The DB stores `time` as "HH:MM:SS" but HabitModal's <input type="time">
 * emits "HH:MM" — normalize both shapes to the shorter form for lexical
 * comparison with `formatHM`.
 */
export function normalizeTime(t: string): string {
  return t.slice(0, 5);
}

/** Stable per-habit-per-day localStorage key for de-duping reminder fires. */
export function firedKey(habitId: string, date: string): string {
  return `${FIRED_KEY_PREFIX}${habitId}:${date}`;
}

export function hasFired(habitId: string, date: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(firedKey(habitId, date)) === "1";
  } catch {
    return false;
  }
}

export function markFired(habitId: string, date: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(firedKey(habitId, date), "1");
  } catch {
    // Private-mode Safari / quota-full: worst case we may re-fire once,
    // which is strictly better than throwing and breaking the tick loop.
  }
}

/**
 * Decide whether a habit's reminder should fire *right now*.
 *
 * Pure function — the caller supplies "now" (as an HH:MM string and a
 * YYYY-MM-DD string) plus the sets of already-completed and already-fired
 * habit ids. This keeps Date.now, localStorage, and DOM access out of the
 * decision path so the logic is trivially testable.
 */
export function shouldFire({
  habit,
  today,
  nowHM,
  completedHabitIds,
  firedHabitIds,
}: {
  habit: Habit;
  today: string;
  nowHM: string;
  completedHabitIds: Set<string>;
  firedHabitIds: Set<string>;
}): boolean {
  if (habit.is_archived) return false;
  if (!habit.reminder_time) return false;
  if (!isHabitDueOn(habit, today)) return false;
  if (completedHabitIds.has(habit.id)) return false;
  if (firedHabitIds.has(habit.id)) return false;
  return normalizeTime(habit.reminder_time) <= nowHM;
}

/**
 * Fire a native browser notification for this habit. Returns the
 * Notification handle, or null if anything blocks it (unsupported,
 * permission not granted, or a constructor throw in a cross-origin
 * iframe). The caller is responsible for marking the habit as fired —
 * that's a deliberate split so tests can exercise `fireReminder` without
 * also mutating localStorage.
 */
export function fireReminder(habit: Habit): Notification | null {
  if (!isSupported()) return null;
  if (Notification.permission !== "granted") return null;
  try {
    return new Notification("Hábito pendiente", {
      body: `Es hora de: ${habit.icon} ${habit.name}`,
      // `tag` coalesces repeat notifications for the same habit into one
      // visible banner — prevents a pile-up if the user leaves the tab
      // open past the reminder time on two devices.
      tag: `habit-${habit.id}`,
      silent: false,
    });
  } catch {
    return null;
  }
}
