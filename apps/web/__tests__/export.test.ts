import {
  buildExport,
  exportFilename,
  exportToJson,
} from "../lib/export";
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

const NOW = "2026-04-20T09:00:00.000Z";

describe("buildExport", () => {
  it("produces the empty envelope when there's nothing", () => {
    const env = buildExport([], [], NOW);
    expect(env.version).toBe(1);
    expect(env.exportedAt).toBe(NOW);
    expect(env.habitsCount).toBe(0);
    expect(env.logsCount).toBe(0);
    expect(env.habits).toEqual([]);
  });

  it("maps habit fields to camelCase and nests logs", () => {
    const env = buildExport(
      [
        makeHabit({
          id: "h1",
          name: "Meditar",
          reminder_time: "08:00:00",
          is_archived: false,
          created_at: "2025-06-01T12:00:00Z",
        }),
      ],
      [makeLog({ habit_id: "h1", completed_at: "2026-04-19", note: "calma" })],
      NOW
    );
    expect(env.habits).toHaveLength(1);
    expect(env.habits[0]).toMatchObject({
      id: "h1",
      name: "Meditar",
      reminderTime: "08:00:00",
      isArchived: false,
      createdAt: "2025-06-01T12:00:00Z",
      logs: [{ date: "2026-04-19", note: "calma" }],
    });
  });

  it("sorts logs oldest-first within a habit", () => {
    const env = buildExport(
      [makeHabit({ id: "h1" })],
      [
        makeLog({ habit_id: "h1", completed_at: "2026-04-20" }),
        makeLog({ habit_id: "h1", completed_at: "2026-04-18" }),
        makeLog({ habit_id: "h1", completed_at: "2026-04-19" }),
      ],
      NOW
    );
    expect(env.habits[0].logs.map((l) => l.date)).toEqual([
      "2026-04-18",
      "2026-04-19",
      "2026-04-20",
    ]);
  });

  it("drops orphan logs (no matching habit)", () => {
    const env = buildExport(
      [makeHabit({ id: "h1" })],
      [
        makeLog({ habit_id: "h1", completed_at: "2026-04-20" }),
        makeLog({ habit_id: "ghost", completed_at: "2026-04-19" }),
      ],
      NOW
    );
    expect(env.logsCount).toBe(1);
    expect(env.habits).toHaveLength(1);
  });

  it("logsCount reflects exported logs, not raw input", () => {
    const env = buildExport(
      [makeHabit({ id: "h1" })],
      [
        makeLog({ habit_id: "h1" }),
        makeLog({ habit_id: "h1" }),
        makeLog({ habit_id: "orphan-habit" }),
      ],
      NOW
    );
    expect(env.logsCount).toBe(2);
  });

  it("preserves complex frequency objects", () => {
    const env = buildExport(
      [makeHabit({ id: "h1", frequency: { days: [0, 2, 4] } })],
      [],
      NOW
    );
    expect(env.habits[0].frequency).toEqual({ days: [0, 2, 4] });
  });
});

describe("exportToJson", () => {
  it("pretty-prints with 2-space indent", () => {
    const env = buildExport([], [], NOW);
    const json = exportToJson(env);
    expect(json).toContain('"version": 1');
    expect(json).toContain('\n  "habits"');
    // Must round-trip to an equal object
    expect(JSON.parse(json)).toEqual(env);
  });
});

describe("exportFilename", () => {
  it("builds a YYYY-MM-DD suffix in local time", () => {
    // Using a date with an unambiguous local representation
    expect(exportFilename("2026-04-20T09:00:00.000Z")).toMatch(
      /^estoicismo-export-\d{4}-\d{2}-\d{2}\.json$/
    );
  });
});
