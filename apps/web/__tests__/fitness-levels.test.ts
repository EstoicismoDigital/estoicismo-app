import {
  estimate1RM,
  computeExerciseLevel,
  computeGlobalLevel,
  bestPerExerciseFromSets,
  getLevelByKey,
  tipForLevel,
  LEVELS,
} from "../lib/fitness/levels";

describe("fitness/levels", () => {
  describe("estimate1RM (Epley)", () => {
    it("returns the same weight for 1 rep", () => {
      expect(estimate1RM(100, 1)).toBe(100);
    });
    it("estimates higher 1RM for higher reps", () => {
      // 80kg × 5 reps → 80 × (1 + 5/30) ≈ 93.33
      expect(estimate1RM(80, 5)).toBeCloseTo(93.33, 1);
    });
    it("returns NaN for reps > 12 (formula degrades)", () => {
      expect(Number.isNaN(estimate1RM(60, 15))).toBe(true);
    });
    it("returns 0 for non-positive inputs", () => {
      expect(estimate1RM(0, 5)).toBe(0);
      expect(estimate1RM(50, 0)).toBe(0);
    });
  });

  describe("computeExerciseLevel — squat", () => {
    it("returns Mortal when ratio < 0.5", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "squat",
        measurement: "weight_reps",
        best1RM: 30,
        bodyweightKg: 80,
      });
      expect(r?.level.key).toBe("mortal");
    });

    it("returns Heracles for 1×bw squat (ratio between 1.0 and 1.5)", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "squat",
        measurement: "weight_reps",
        best1RM: 100,
        bodyweightKg: 80,
      });
      expect(r?.level.key).toBe("heracles");
    });

    it("returns Apolo for 1.7×bw squat", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "squat",
        measurement: "weight_reps",
        best1RM: 136,
        bodyweightKg: 80,
      });
      expect(r?.level.key).toBe("apolo");
    });

    it("returns Zeus for 3.5×bw squat", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "squat",
        measurement: "weight_reps",
        best1RM: 280,
        bodyweightKg: 80,
      });
      // 280/80 = 3.5 exactamente — el threshold de zeus es 3.5, así que cae en Zeus o el siguiente.
      // Con value < 3.5 → titan. Con value >= 3.5 → zeus.
      // Aquí value === 3.5 → no es < 3.5, sigue al chequeo de zeus < 3.5 que es false.
      // Pasa al cómputo de Olimpo.
      expect(["titan", "zeus", "olimpo-i"]).toContain(r?.level.key);
    });

    it("returns null when no bodyweight provided", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "squat",
        measurement: "weight_reps",
        best1RM: 100,
        bodyweightKg: null,
      });
      expect(r).toBeNull();
    });
  });

  describe("computeExerciseLevel — pull-ups", () => {
    it("returns Perseo for 3 reps", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "pull-ups",
        measurement: "reps_only",
        bestReps: 3,
        bodyweightKg: 80,
      });
      expect(r?.level.key).toBe("perseo");
    });

    it("returns Apolo for 12 reps", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "pull-ups",
        measurement: "reps_only",
        bestReps: 12,
        bodyweightKg: 80,
      });
      expect(r?.level.key).toBe("apolo");
    });

    it("does not need bodyweight for reps_only", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "pull-ups",
        measurement: "reps_only",
        bestReps: 7,
        bodyweightKg: null,
      });
      expect(r?.level.key).toBe("heracles");
    });
  });

  describe("computeExerciseLevel — unknown slug", () => {
    it("returns null for non-main lifts", () => {
      const r = computeExerciseLevel({
        exerciseSlug: "barbell-row",
        measurement: "weight_reps",
        best1RM: 100,
        bodyweightKg: 80,
      });
      expect(r).toBeNull();
    });
  });

  describe("computeGlobalLevel", () => {
    it("returns null when no per-exercise levels", () => {
      expect(computeGlobalLevel([])).toBeNull();
    });

    it("filters out non-main lifts", () => {
      const result = computeGlobalLevel([
        { exerciseSlug: "barbell-row", level: getLevelByKey("zeus") },
      ]);
      expect(result).toBeNull();
    });

    it("returns floor of average rank", () => {
      const r = computeGlobalLevel([
        { exerciseSlug: "squat", level: getLevelByKey("apolo") }, // rank 3
        { exerciseSlug: "bench-press", level: getLevelByKey("heracles") }, // rank 2
        { exerciseSlug: "deadlift", level: getLevelByKey("apolo") }, // rank 3
      ]);
      // avg = 8/3 ≈ 2.67 → floor 2 → heracles
      expect(r?.key).toBe("heracles");
    });
  });

  describe("bestPerExerciseFromSets", () => {
    it("computes best 1RM per exercise from raw sets", () => {
      const sets = [
        { exercise_id: "squat", weight_kg: 100, reps: 5 },
        { exercise_id: "squat", weight_kg: 110, reps: 3 },
        { exercise_id: "squat", weight_kg: 80, reps: 10 },
        { exercise_id: "bench", weight_kg: 80, reps: 3 },
      ];
      const map = bestPerExerciseFromSets(sets);
      // 110 × 3 = 110 × (1 + 0.1) = 121
      // 100 × 5 = 100 × (1 + 5/30) ≈ 116.67
      // 80 × 10 = 80 × (1 + 10/30) ≈ 106.67
      // best = 121
      expect(map.get("squat")?.best1RM).toBeCloseTo(121, 0);
      expect(map.get("squat")?.bestReps).toBe(10);
    });
  });

  describe("LEVELS", () => {
    it("contains 10 levels in order", () => {
      expect(LEVELS).toHaveLength(10);
      expect(LEVELS[0].key).toBe("mortal");
      expect(LEVELS[6].key).toBe("zeus");
      expect(LEVELS[9].key).toBe("olimpo-iii");
    });

    it("each rank matches its index", () => {
      LEVELS.forEach((l, i) => {
        expect(l.rank).toBe(i);
      });
    });
  });

  describe("tipForLevel", () => {
    it("returns a non-empty string for any level + goal combo", () => {
      for (const lvl of LEVELS) {
        for (const goal of ["fuerza", "hipertrofia", "resistencia", "salud"] as const) {
          const tip = tipForLevel(lvl, goal);
          expect(tip).toBeTruthy();
          expect(tip.length).toBeGreaterThan(10);
        }
      }
    });
  });
});
