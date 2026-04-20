import {
  buildNoteEntries,
  groupNotesByDate,
  filterNotes,
  formatNoteDayLabel,
  type NoteEntry,
} from "../lib/notes";
import type { Habit, HabitLog } from "@estoicismo/supabase";

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    user_id: "u1",
    name: "Lectura",
    icon: "📚",
    color: "#8B6F47",
    frequency: "daily",
    reminder_time: null,
    is_archived: false,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeLog(overrides: Partial<HabitLog> = {}): HabitLog {
  return {
    id: "log-1",
    habit_id: "h1",
    user_id: "u1",
    completed_at: "2026-04-20",
    note: null,
    ...overrides,
  };
}

describe("buildNoteEntries", () => {
  it("returns empty when no logs", () => {
    expect(buildNoteEntries([], [])).toEqual([]);
  });

  it("drops logs with null or empty notes", () => {
    const habits = [makeHabit()];
    const logs = [
      makeLog({ id: "a", note: null }),
      makeLog({ id: "b", note: "" }),
      makeLog({ id: "c", note: "   " }),
    ];
    expect(buildNoteEntries(logs, habits)).toEqual([]);
  });

  it("enriches with habit metadata", () => {
    const habits = [
      makeHabit({ id: "h1", name: "Lectura", icon: "📚", color: "#AAA" }),
    ];
    const logs = [
      makeLog({
        id: "log-1",
        habit_id: "h1",
        completed_at: "2026-04-20",
        note: "Buena sesión",
      }),
    ];
    const [entry] = buildNoteEntries(logs, habits);
    expect(entry).toMatchObject({
      logId: "log-1",
      habitId: "h1",
      habitName: "Lectura",
      habitIcon: "📚",
      habitColor: "#AAA",
      date: "2026-04-20",
      text: "Buena sesión",
    });
  });

  it("trims whitespace off stored notes", () => {
    const habits = [makeHabit()];
    const logs = [makeLog({ note: "  hola  " })];
    expect(buildNoteEntries(logs, habits)[0].text).toBe("hola");
  });

  it("drops logs whose habit is missing (defensive, not a crash)", () => {
    const habits = [makeHabit({ id: "h1" })];
    const logs = [
      makeLog({ id: "good", habit_id: "h1", note: "ok" }),
      makeLog({ id: "orphan", habit_id: "h404", note: "sin habit" }),
    ];
    const res = buildNoteEntries(logs, habits);
    expect(res).toHaveLength(1);
    expect(res[0].logId).toBe("good");
  });

  it("sorts newest date first", () => {
    const habits = [makeHabit()];
    const logs = [
      makeLog({ id: "a", completed_at: "2026-04-10", note: "a" }),
      makeLog({ id: "b", completed_at: "2026-04-20", note: "b" }),
      makeLog({ id: "c", completed_at: "2026-04-15", note: "c" }),
    ];
    const res = buildNoteEntries(logs, habits);
    expect(res.map((e) => e.date)).toEqual([
      "2026-04-20",
      "2026-04-15",
      "2026-04-10",
    ]);
  });
});

describe("groupNotesByDate", () => {
  it("returns empty for empty input", () => {
    expect(groupNotesByDate([])).toEqual([]);
  });

  it("groups consecutive same-date entries together", () => {
    const entries: NoteEntry[] = [
      {
        logId: "1",
        habitId: "h1",
        habitName: "A",
        habitIcon: "📚",
        habitColor: "#000",
        date: "2026-04-20",
        text: "one",
      },
      {
        logId: "2",
        habitId: "h2",
        habitName: "B",
        habitIcon: "🧘",
        habitColor: "#111",
        date: "2026-04-20",
        text: "two",
      },
      {
        logId: "3",
        habitId: "h1",
        habitName: "A",
        habitIcon: "📚",
        habitColor: "#000",
        date: "2026-04-19",
        text: "three",
      },
    ];
    const groups = groupNotesByDate(entries);
    expect(groups).toHaveLength(2);
    expect(groups[0].date).toBe("2026-04-20");
    expect(groups[0].notes).toHaveLength(2);
    expect(groups[1].date).toBe("2026-04-19");
    expect(groups[1].notes).toHaveLength(1);
  });

  it("preserves order within a group", () => {
    const entries: NoteEntry[] = [
      {
        logId: "1",
        habitId: "h1",
        habitName: "A",
        habitIcon: "📚",
        habitColor: "#000",
        date: "2026-04-20",
        text: "first",
      },
      {
        logId: "2",
        habitId: "h2",
        habitName: "B",
        habitIcon: "🧘",
        habitColor: "#111",
        date: "2026-04-20",
        text: "second",
      },
    ];
    const groups = groupNotesByDate(entries);
    expect(groups[0].notes.map((n) => n.text)).toEqual(["first", "second"]);
  });
});

describe("filterNotes", () => {
  const entries: NoteEntry[] = [
    {
      logId: "1",
      habitId: "h1",
      habitName: "Lectura",
      habitIcon: "📚",
      habitColor: "#000",
      date: "2026-04-20",
      text: "Hoy terminé Meditaciones",
    },
    {
      logId: "2",
      habitId: "h2",
      habitName: "Meditar",
      habitIcon: "🧘",
      habitColor: "#111",
      date: "2026-04-19",
      text: "Calma antes del trabajo",
    },
    {
      logId: "3",
      habitId: "h3",
      habitName: "Correr",
      habitIcon: "🏃",
      habitColor: "#222",
      date: "2026-04-18",
      text: "5 km en 28 minutos",
    },
  ];

  it("returns all entries when query is empty", () => {
    expect(filterNotes(entries, "")).toHaveLength(3);
    expect(filterNotes(entries, "   ")).toHaveLength(3);
  });

  it("matches note text (case-insensitive)", () => {
    const res = filterNotes(entries, "MEDITA");
    // Matches "Meditaciones" in text AND "Meditar" in habit name
    expect(res.map((e) => e.logId).sort()).toEqual(["1", "2"]);
  });

  it("matches habit name even if text does not", () => {
    const res = filterNotes(entries, "correr");
    expect(res).toHaveLength(1);
    expect(res[0].logId).toBe("3");
  });

  it("returns empty when nothing matches", () => {
    expect(filterNotes(entries, "xyzzy")).toEqual([]);
  });
});

describe("formatNoteDayLabel", () => {
  const today = "2026-04-20"; // a Monday

  it("returns 'Hoy' for the reference date", () => {
    expect(formatNoteDayLabel(today, today)).toBe("Hoy");
  });

  it("returns 'Ayer' for the previous day", () => {
    expect(formatNoteDayLabel("2026-04-19", today)).toBe("Ayer");
  });

  it("returns the weekday name for the same ISO week", () => {
    // 2026-04-15 is a Wednesday, 5 days before Monday 2026-04-20
    expect(formatNoteDayLabel("2026-04-15", today)).toBe("Miércoles");
  });

  it("returns a full date for anything older than ~a week", () => {
    expect(formatNoteDayLabel("2026-04-12", today)).toBe("12 Abril 2026");
    expect(formatNoteDayLabel("2025-12-25", today)).toBe("25 Diciembre 2025");
  });
});
