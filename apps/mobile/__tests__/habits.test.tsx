import { calculateStreak } from '../hooks/useStreak';
import type { HabitLog } from '../types/habits';

const HABIT_ID = 'h1';
const USER_ID = 'u1';

function makeLog(completed_at: string): HabitLog {
  return { id: completed_at, habit_id: HABIT_ID, user_id: USER_ID, completed_at, note: null };
}

describe('calculateStreak', () => {
  it('returns 0 when no logs', () => {
    expect(calculateStreak([], HABIT_ID, '2026-04-19')).toBe(0);
  });

  it('returns 1 when only today is done', () => {
    const logs = [makeLog('2026-04-19')];
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(1);
  });

  it('returns 3 for three consecutive days ending today', () => {
    const logs = [
      makeLog('2026-04-17'),
      makeLog('2026-04-18'),
      makeLog('2026-04-19'),
    ];
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(3);
  });

  it('returns streak from yesterday when today is not done', () => {
    const logs = [
      makeLog('2026-04-17'),
      makeLog('2026-04-18'),
    ];
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(2);
  });

  it('returns 0 when yesterday is missing (broken streak)', () => {
    const logs = [
      makeLog('2026-04-16'),
      makeLog('2026-04-17'),
      // 2026-04-18 missing
    ];
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(0);
  });

  it('ignores logs from other habits', () => {
    const logs = [
      makeLog('2026-04-17'),
      { id: 'other', habit_id: 'other-habit', user_id: USER_ID, completed_at: '2026-04-18', note: null },
      makeLog('2026-04-19'),
    ];
    // gap on 04-18 for HABIT_ID → streak = 1
    expect(calculateStreak(logs, HABIT_ID, '2026-04-19')).toBe(1);
  });
});
