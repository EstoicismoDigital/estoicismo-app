// apps/mobile/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import type { Habit } from '../types/habits';

// Show alert when notification arrives while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Asks the user for notification permission. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

// JS getDay() returns 0 (Sun) .. 6 (Sat).
// expo-notifications weekday is 1 (Sun) .. 7 (Sat).
function jsDayToExpoWeekday(jsDay: number): number {
  return ((jsDay % 7) + 1);
}

/**
 * Schedules local notification(s) for a habit.
 * - Daily habit or legacy "weekly" string → one daily notification at reminder_time.
 * - { days: number[] } frequency → one notification per active JS weekday (0=Sun..6=Sat).
 * Cancels any existing notifications for this habit first.
 */
export async function scheduleHabitNotification(habit: Habit): Promise<void> {
  if (!habit.reminder_time) return;
  await cancelHabitNotification(habit.id);

  const { hour, minute } = parseTime(habit.reminder_time);
  const body = `Es hora de: ${habit.icon} ${habit.name}`;

  // Daily: single repeating daily trigger.
  if (habit.frequency === 'daily' || habit.frequency === 'weekly') {
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habit.id}`,
      content: { title: 'Hábito pendiente', body },
      trigger: { type: 'daily', hour, minute } as unknown as Notifications.NotificationTriggerInput,
    });
    return;
  }

  // Specific days: one weekly trigger per day.
  const freq = habit.frequency as { days: number[] };
  if (!Array.isArray(freq.days) || freq.days.length === 0) return;

  await Promise.all(
    freq.days.map((jsDay) => {
      const weekday = jsDayToExpoWeekday(jsDay);
      return Notifications.scheduleNotificationAsync({
        identifier: `habit-${habit.id}-day${weekday}`,
        content: { title: 'Hábito pendiente', body },
        trigger: {
          type: 'weekly',
          weekday,
          hour,
          minute,
        } as unknown as Notifications.NotificationTriggerInput,
      });
    }),
  );
}

/**
 * Cancels all scheduled notifications for a specific habit.
 * Handles both daily (`habit-{id}`) and weekly (`habit-{id}-day{n}`) identifiers.
 */
export async function cancelHabitNotification(habitId: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const prefix = `habit-${habitId}`;
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Cancels all habit-related scheduled notifications (e.g., on logout). */
export async function cancelAllHabitNotifications(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith('habit-'))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}
