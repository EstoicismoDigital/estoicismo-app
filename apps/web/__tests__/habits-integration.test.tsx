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
});
