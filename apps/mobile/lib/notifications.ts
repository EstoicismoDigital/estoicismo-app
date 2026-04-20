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

// Weekday numbers for expo-notifications (1 = Sun, 2 = Mon, ..., 7 = Sat)
const WEEKLY_DAYS: Record<number, number[]> = {
  3: [2, 4, 6], // Mon, Wed, Fri
  4: [2, 3, 5, 6], // Mon, Tue, Thu, Fri
  5: [2, 3, 4, 5, 6], // Mon–Fri
};

/**
 * Schedules local notification(s) for a habit.
 * - Daily habit → one daily notification at reminder_time.
 * - Weekly habit → one notification per active weekday.
 * Cancels any existing notifications for this habit first.
 */
export async function scheduleHabitNotification(habit: Habit): Promise<void> {
  if (!habit.reminder_time) return;
  await cancelHabitNotification(habit.id);

  const { hour, minute } = parseTime(habit.reminder_time);
  const body = `Es hora de: ${habit.icon} ${habit.name}`;

  if (habit.frequency === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habit.id}`,
      content: { title: 'Hábito pendiente', body },
      trigger: { type: 'daily', hour, minute } as unknown as Notifications.NotificationTriggerInput,
    });
  } else {
    const { times } = habit.frequency as { times: number; period: 'week' };
    const weekdays = WEEKLY_DAYS[times] ?? WEEKLY_DAYS[3];
    await Promise.all(
      weekdays.map((weekday) =>
        Notifications.scheduleNotificationAsync({
          identifier: `habit-${habit.id}-day${weekday}`,
          content: { title: 'Hábito pendiente', body },
          trigger: { type: 'weekly', weekday, hour, minute } as unknown as Notifications.NotificationTriggerInput,
        }),
      ),
    );
  }
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
