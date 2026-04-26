import {
  JOURNAL_PROMPTS,
  getDailyJournalPrompt,
  getRandomJournalPrompt,
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
