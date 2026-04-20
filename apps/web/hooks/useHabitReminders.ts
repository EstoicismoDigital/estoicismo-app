"use client";
import { useEffect } from "react";
import type { Habit, HabitLog } from "@estoicismo/supabase";
import {
  fireReminder,
  formatHM,
  getPermission,
  hasFired,
  isSupported,
  markFired,
  shouldFire,
} from "../lib/notifications";
import { getTodayStr } from "../lib/dateUtils";

/**
 * Drives time-based habit reminders while the tab is open.
 *
 * Runs a single 30-second tick that, on every cycle:
 *   1. Computes today's date + current HH:MM in the user's local time.
 *   2. Projects which habits are already done today (from the logs prop).
 *   3. Projects which habits already fired today (from localStorage).
 *   4. Calls `fireReminder` for every habit whose reminder_time has
 *      passed and isn't suppressed — each fire is marked so it won't
 *      re-fire this day, even across reloads or remounts.
 *
 * Early exits keep the cost near zero when the feature doesn't apply:
 *   - Notification API unsupported (SSR, jsdom, iOS Safari in a regular
 *     tab, older browsers) → nothing scheduled.
 *   - Permission != "granted" → nothing scheduled. The banner nudges the
 *     user to grant; on grant the parent re-renders and we start.
 *   - Zero habits with a reminder_time set → nothing scheduled.
 *
 * Tick cadence: 30s is enough resolution for HH:MM reminders (a reminder
 * is bounded to fire within 30s of its time), while being rare enough
 * that a background tab's timer throttling doesn't measurably impact
 * delivery.
 */
export function useHabitReminders(
  habits: Habit[] | undefined,
  logs: HabitLog[] | undefined
): void {
  useEffect(() => {
    if (!isSupported()) return;
    if (getPermission() !== "granted") return;

    const list = habits ?? [];
    const hasAnyReminder = list.some(
      (h) => !h.is_archived && h.reminder_time
    );
    if (!hasAnyReminder) return;

    function tick() {
      const today = getTodayStr();
      const nowHM = formatHM(new Date());

      const completedHabitIds = new Set(
        (logs ?? [])
          .filter((l) => l.completed_at === today)
          .map((l) => l.habit_id)
      );
      const firedHabitIds = new Set(
        list.filter((h) => hasFired(h.id, today)).map((h) => h.id)
      );

      for (const habit of list) {
        if (
          shouldFire({
            habit,
            today,
            nowHM,
            completedHabitIds,
            firedHabitIds,
          })
        ) {
          if (fireReminder(habit)) {
            markFired(habit.id, today);
            // Keep the local set in sync so the next iteration of this
            // same tick can't double-fire when two habits share a time.
            firedHabitIds.add(habit.id);
          }
        }
      }
    }

    // Run once immediately so a habit whose time has already passed on
    // page load gets a reminder without waiting 30s.
    tick();
    const handle = window.setInterval(tick, 30_000);
    return () => window.clearInterval(handle);
    // We intentionally depend on the full arrays — React's referential
    // equality is exactly what we need: when useQuery returns a new
    // array after an invalidation, we rebuild the tick closure so newly
    // added / edited reminders take effect immediately.
  }, [habits, logs]);
}
