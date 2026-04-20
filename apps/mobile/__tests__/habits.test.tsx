import React from 'react';
import { calculateStreak } from '../hooks/useStreak';
import type { Habit, HabitLog } from '../types/habits';
import { render, fireEvent } from '@testing-library/react-native';
import { HabitCard } from '../components/habits/HabitCard';

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

// ── HabitCard tests ────────────────────────────────────────────────────────

jest.mock('@estoicismo/ui', () => {
  const mockReact = require('react');
  const { Text: RNText } = require('react-native');
  return {
    Text: ({ children, style, numberOfLines, ellipsizeMode }: any) =>
      mockReact.createElement(RNText, { style, numberOfLines, ellipsizeMode }, children),
    colors: { bgAlt: '#F5F1EA', ink: '#0A0A0A', accent: '#8B6F47', line: '#E5E1DA', success: '#2D7A4F', bg: '#FFFFFF', muted: '#5E5E5E' },
    spacing: { sm: 8, xs: 4, md: 16, lg: 24, xl: 32 },
    radius: { md: 12, sm: 8 },
    fontFamilies: { mono: 'monospace', body: 'sans-serif', bodyMedium: 'sans-serif' },
    fontSizes: { base: 14 },
  };
});

jest.mock('../lib/dateUtils', () => ({
  getTodayStr: () => '2026-04-19',
  getCurrentWeekDays: () => [
    { date: '2026-04-14', label: 'L' },
    { date: '2026-04-15', label: 'M' },
    { date: '2026-04-16', label: 'X' },
    { date: '2026-04-17', label: 'J' },
    { date: '2026-04-18', label: 'V' },
    { date: '2026-04-19', label: 'S' },
    { date: '2026-04-20', label: 'D' },
  ],
  subtractDays: (dateStr: string, days: number): string => {
    const d = new Date(`${dateStr}T12:00:00`);
    d.setDate(d.getDate() - days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const MOCK_HABIT: Habit = {
  id: 'h1',
  user_id: 'u1',
  name: 'Meditar',
  icon: '🧘',
  color: '#4F8EF7',
  frequency: 'daily',
  reminder_time: null,
  is_archived: false,
  created_at: '2026-04-01T00:00:00Z',
};

describe('HabitCard', () => {
  it('renders habit name and emoji', () => {
    const { getByText } = render(
      <HabitCard
        habit={MOCK_HABIT}
        logs={[]}
        onToggle={jest.fn()}
        onLongPress={jest.fn()}
      />,
    );
    expect(getByText('Meditar')).toBeTruthy();
    expect(getByText('🧘')).toBeTruthy();
  });

  it('calls onToggle when check is pressed', () => {
    const onToggle = jest.fn();
    const { getByLabelText } = render(
      <HabitCard
        habit={MOCK_HABIT}
        logs={[]}
        onToggle={onToggle}
        onLongPress={jest.fn()}
      />,
    );
    fireEvent.press(
      getByLabelText('Meditar — pendiente'),
    );
    expect(onToggle).toHaveBeenCalledWith('h1', false);
  });

  it('shows checkmark and calls onToggle with isCompleted=true when already done', () => {
    const completedLog: HabitLog = {
      id: 'log1',
      habit_id: 'h1',
      user_id: 'u1',
      completed_at: '2026-04-19',
      note: null,
    };
    const onToggle = jest.fn();
    const { getByLabelText } = render(
      <HabitCard
        habit={MOCK_HABIT}
        logs={[completedLog]}
        onToggle={onToggle}
        onLongPress={jest.fn()}
      />,
    );
    fireEvent.press(
      getByLabelText('Meditar — completado'),
    );
    expect(onToggle).toHaveBeenCalledWith('h1', true);
  });
});
