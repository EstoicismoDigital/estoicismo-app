import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Habit, HabitLog, Profile } from "@estoicismo/supabase";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/",
}));

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockLink.displayName = "MockLink";
  return MockLink;
});

const mockToggle = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockArchive = jest.fn();
const mockUpsertNote = jest.fn();

const habitsState: { habits: Habit[]; logs: HabitLog[]; isLoading: boolean } = {
  habits: [],
  logs: [],
  isLoading: false,
};
const profileState: { data: Profile | null | undefined } = { data: null };

jest.mock("../hooks/useHabits", () => ({
  useHabits: () => habitsState,
  useToggleHabit: () => ({ mutate: mockToggle, isPending: false }),
  useCreateHabit: () => ({
    mutate: mockCreate,
    mutateAsync: mockCreate,
    isPending: false,
  }),
  useUpdateHabit: () => ({
    mutate: mockUpdate,
    mutateAsync: mockUpdate,
    isPending: false,
  }),
  useArchiveHabit: () => ({ mutate: mockArchive, isPending: false }),
  useUpsertHabitLogNote: () => ({
    mutate: mockUpsertNote,
    mutateAsync: mockUpsertNote,
    isPending: false,
  }),
}));

jest.mock("../hooks/useProfile", () => ({
  useProfile: () => profileState,
}));

jest.mock("../hooks/useDailyQuote", () => ({
  useDailyQuote: () => ({
    data: { text: "Hoc est", author: "Séneca" },
  }),
}));

// Import *after* mocks so jest resolves them correctly
import { HabitsDashboard } from "../app/(dashboard)/HabitsDashboard";

describe("HabitsDashboard", () => {
  beforeEach(() => {
    habitsState.habits = [];
    habitsState.logs = [];
    habitsState.isLoading = false;
    profileState.data = {
      id: "u1",
      username: null,
      avatar_url: null,
      timezone: "UTC",
      plan: "free",
      plan_expires_at: null,
      streak_freeze_count: 0,
      stripe_customer_id: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    mockToggle.mockClear();
    mockCreate.mockClear();
    mockUpdate.mockClear();
    mockArchive.mockClear();
    mockUpsertNote.mockClear();
  });

  it("renders the Hoy heading", () => {
    render(<HabitsDashboard />);
    // There's an h2 "Hoy" inside the section
    expect(
      screen.getByRole("heading", { name: /hoy/i, level: 2 })
    ).toBeInTheDocument();
  });

  it("shows empty state CTA when no habits", () => {
    render(<HabitsDashboard />);
    expect(
      screen.getByRole("button", { name: /crear mi primer hábito/i })
    ).toBeInTheDocument();
  });

  it("opens the modal when clicking the empty state CTA", () => {
    render(<HabitsDashboard />);
    const cta = screen.getByRole("button", { name: /crear mi primer hábito/i });
    fireEvent.click(cta);
    // Modal title "Define tu hábito"
    expect(
      screen.getByRole("heading", { name: /define tu hábito/i })
    ).toBeInTheDocument();
    // Name input is labelled via the mono label
    expect(screen.getByPlaceholderText(/meditar 10 minutos/i)).toBeInTheDocument();
  });

  it("renders habit rows and a creation FAB when habits exist", () => {
    habitsState.habits = [
      {
        id: "h1",
        user_id: "u1",
        name: "Meditar",
        icon: "🧘",
        color: "#4F8EF7",
        frequency: "daily",
        reminder_time: null,
        is_archived: false,
        created_at: "2025-04-01T00:00:00Z",
      },
    ];
    render(<HabitsDashboard />);
    // "Meditar" may appear in both the main habit list and the timeline chip list
    expect(screen.getAllByText("Meditar").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /crear nuevo hábito/i })
    ).toBeInTheDocument();
  });

  it("opens the note dialog and saves a note for a completed habit", async () => {
    const today = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();
    habitsState.habits = [
      {
        id: "h1",
        user_id: "u1",
        name: "Meditar",
        icon: "🧘",
        color: "#4F8EF7",
        frequency: "daily",
        reminder_time: null,
        is_archived: false,
        created_at: "2025-04-01T00:00:00Z",
      },
    ];
    habitsState.logs = [
      {
        id: "log-1",
        habit_id: "h1",
        user_id: "u1",
        completed_at: today,
        note: null,
      },
    ];

    render(<HabitsDashboard />);
    // The note button appears next to the completed habit row
    const noteBtn = screen.getByRole("button", {
      name: /añadir nota a meditar/i,
    });
    fireEvent.click(noteBtn);

    // Dialog is open with the habit name as title
    expect(
      screen.getByRole("heading", { name: /meditar/i, level: 2 })
    ).toBeInTheDocument();

    // Type a note and submit
    const textarea = screen.getByPlaceholderText(/qué aprendiste hoy/i);
    fireEvent.change(textarea, {
      target: { value: "Mente tranquila, decisiones firmes." },
    });

    const save = screen.getByRole("button", { name: /guardar/i });
    fireEvent.click(save);

    expect(mockUpsertNote).toHaveBeenCalledWith({
      habitId: "h1",
      date: today,
      note: "Mente tranquila, decisiones firmes.",
    });
  });
});
