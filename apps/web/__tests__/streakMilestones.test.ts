import {
  STREAK_MILESTONES,
  findCrossedMilestone,
} from "../lib/streakMilestones";

describe("STREAK_MILESTONES", () => {
  it("is sorted ascending by days", () => {
    for (let i = 1; i < STREAK_MILESTONES.length; i++) {
      expect(STREAK_MILESTONES[i].days).toBeGreaterThan(
        STREAK_MILESTONES[i - 1].days
      );
    }
  });

  it("all milestones have non-empty copy", () => {
    for (const m of STREAK_MILESTONES) {
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
    }
  });
});

describe("findCrossedMilestone", () => {
  it("returns null when streak did not grow", () => {
    expect(findCrossedMilestone(5, 5)).toBeNull();
    expect(findCrossedMilestone(10, 3)).toBeNull();
    expect(findCrossedMilestone(0, 0)).toBeNull();
  });

  it("returns null when streak grows but no threshold was crossed", () => {
    expect(findCrossedMilestone(1, 2)).toBeNull();
    expect(findCrossedMilestone(8, 10)).toBeNull();
    expect(findCrossedMilestone(31, 40)).toBeNull();
  });

  it("fires at the exact threshold day", () => {
    expect(findCrossedMilestone(2, 3)?.days).toBe(3);
    expect(findCrossedMilestone(6, 7)?.days).toBe(7);
    expect(findCrossedMilestone(13, 14)?.days).toBe(14);
    expect(findCrossedMilestone(29, 30)?.days).toBe(30);
    expect(findCrossedMilestone(59, 60)?.days).toBe(60);
    expect(findCrossedMilestone(99, 100)?.days).toBe(100);
    expect(findCrossedMilestone(364, 365)?.days).toBe(365);
  });

  it("does not refire the same milestone when already past it", () => {
    // prev already >= threshold means no new crossing
    expect(findCrossedMilestone(7, 8)).toBeNull();
    expect(findCrossedMilestone(30, 31)).toBeNull();
  });

  it("returns the earliest crossed milestone when multiple jumped at once", () => {
    // e.g. a backfill that goes from 0 → 10 crosses both 3 and 7.
    // We fire the smaller one so the user sees progress in order.
    expect(findCrossedMilestone(0, 10)?.days).toBe(3);
    expect(findCrossedMilestone(2, 100)?.days).toBe(3);
    expect(findCrossedMilestone(10, 35)?.days).toBe(14);
  });
});
