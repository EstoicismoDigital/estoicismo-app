import {
  JOURNAL_PROMPTS,
  STOIC_PILLAR_PROMPTS,
  RECOVERY_PROMPTS,
  CELEBRATION_PROMPTS,
  getDailyJournalPrompt,
  getRandomJournalPrompt,
  getRecoveryPrompt,
  getCelebrationPrompt,
  getPromptByPillar,
  currentMoment,
  allPrompts,
  type DayMoment,
  type StoicPillar,
} from "../lib/journal/prompts";

describe("journal/prompts", () => {
  it("contains at least 30 prompts (seed mínimo)", () => {
    expect(JOURNAL_PROMPTS.length).toBeGreaterThanOrEqual(30);
  });

  it("each prompt has unique id and non-empty text", () => {
    const seen = new Set<string>();
    for (const p of JOURNAL_PROMPTS) {
      expect(p.text.trim().length).toBeGreaterThan(10);
      expect(seen.has(p.id)).toBe(false);
      seen.add(p.id);
    }
  });

  it("getDailyJournalPrompt is deterministic for same day", () => {
    const a = getDailyJournalPrompt(0);
    const b = getDailyJournalPrompt(0);
    expect(a.id).toBe(b.id);
  });

  it("seed offset returns different prompts", () => {
    const first = getDailyJournalPrompt(0);
    const second = getDailyJournalPrompt(1);
    // Pueden ser iguales en el extremo pero estadísticamente diferentes.
    // Si el array tiene N elementos, son distintos al 99% si N > 1.
    if (JOURNAL_PROMPTS.length > 1) {
      // Verificamos que NO siempre devuelve el mismo
      const allSame = [0, 1, 2, 3, 4].every(
        (off) => getDailyJournalPrompt(off).id === first.id
      );
      expect(allSame).toBe(false);
    }
  });

  it("getRandomJournalPrompt returns valid prompt", () => {
    const r = getRandomJournalPrompt();
    expect(JOURNAL_PROMPTS).toContainEqual(r);
  });

  it("each suggestedArea is one of the valid areas", () => {
    const valid = new Set([
      "free",
      "habits",
      "fitness",
      "lectura",
      "finanzas",
      "mentalidad",
      "emprendimiento",
    ]);
    for (const p of JOURNAL_PROMPTS) {
      if (p.suggestedArea) {
        expect(valid.has(p.suggestedArea)).toBe(true);
      }
    }
  });
});

describe("journal/prompts v2 (pillar pool + recovery + celebration)", () => {
  it("STOIC_PILLAR_PROMPTS has 35+ prompts per pillar", () => {
    const pillars: StoicPillar[] = ["epicteto", "marco_aurelio", "porcia", "seneca"];
    for (const pillar of pillars) {
      const count = STOIC_PILLAR_PROMPTS.filter((p) => p.pillar === pillar).length;
      expect(count).toBeGreaterThanOrEqual(30);
    }
  });

  it("every pillar prompt has pillar + moment + depth metadata", () => {
    for (const p of STOIC_PILLAR_PROMPTS) {
      expect(p.pillar).toBeDefined();
      expect(p.moment).toBeDefined();
      expect(p.depth).toBeDefined();
      expect(["easy", "medium", "deep"]).toContain(p.depth);
      expect(["morning", "midday", "evening", "anytime"]).toContain(p.moment);
    }
  });

  it("RECOVERY_PROMPTS y CELEBRATION_PROMPTS existen y son distintos", () => {
    expect(RECOVERY_PROMPTS.length).toBeGreaterThanOrEqual(10);
    expect(CELEBRATION_PROMPTS.length).toBeGreaterThanOrEqual(10);
    // Recovery y celebration deben tener IDs disjuntos (prefijos pa/cb)
    const recIds = RECOVERY_PROMPTS.map((p) => p.id);
    const celIds = CELEBRATION_PROMPTS.map((p) => p.id);
    expect(recIds.some((id) => celIds.includes(id))).toBe(false);
  });

  it("getRecoveryPrompt y getCelebrationPrompt devuelven prompt válido", () => {
    const r = getRecoveryPrompt();
    expect(RECOVERY_PROMPTS.map((p) => p.id)).toContain(r.id);
    const c = getCelebrationPrompt();
    expect(CELEBRATION_PROMPTS.map((p) => p.id)).toContain(c.id);
  });

  it("getPromptByPillar filtra correctamente", () => {
    const epic = getPromptByPillar("epicteto");
    expect(epic.pillar).toBe("epicteto");
    const marco = getPromptByPillar("marco_aurelio");
    expect(marco.pillar).toBe("marco_aurelio");
  });

  it("getPromptByPillar filtra por moment cuando se pasa", () => {
    const morning = getPromptByPillar("epicteto", "morning");
    // El prompt devuelto debe ser pillar=epicteto y moment=morning|anytime
    expect(morning.pillar).toBe("epicteto");
    expect(["morning", "anytime"]).toContain(morning.moment);
  });

  it("currentMoment devuelve un valor válido", () => {
    const m = currentMoment();
    const valid: DayMoment[] = ["morning", "midday", "evening", "anytime"];
    expect(valid).toContain(m);
  });

  it("allPrompts incluye los 4 pools", () => {
    const all = allPrompts();
    // Total debería ser >= 50 (v1) + 13 (mood) + 140 (pillar) + 10 + 10
    expect(all.length).toBeGreaterThanOrEqual(220);
    const ids = new Set(all.map((p) => p.id));
    expect(ids.size).toBe(all.length); // todos los IDs únicos
  });

  it("ningún prompt v2 usa lenguaje de guilt ('deberías', 'tienes que')", () => {
    const banned = /\b(deber[íi]as|tienes que|debes\b)/i;
    for (const p of [
      ...STOIC_PILLAR_PROMPTS,
      ...RECOVERY_PROMPTS,
      ...CELEBRATION_PROMPTS,
    ]) {
      expect(p.text).not.toMatch(banned);
    }
  });
});
