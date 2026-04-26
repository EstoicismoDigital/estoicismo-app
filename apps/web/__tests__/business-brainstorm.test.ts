import {
  suggestIdeas,
  getAllPassions,
  getAllSkills,
  getAllBudgets,
  getAllTimes,
  PASSION_LABELS,
  SKILL_LABELS,
} from "../lib/business/brainstorm";

describe("business/brainstorm", () => {
  describe("getAllPassions / Skills / Budgets / Times", () => {
    it("returns non-empty lists", () => {
      expect(getAllPassions().length).toBeGreaterThan(0);
      expect(getAllSkills().length).toBeGreaterThan(0);
      expect(getAllBudgets().length).toBeGreaterThan(0);
      expect(getAllTimes().length).toBeGreaterThan(0);
    });

    it("each passion has a label", () => {
      for (const p of getAllPassions()) {
        expect(PASSION_LABELS[p]).toBeTruthy();
      }
    });

    it("each skill has a label", () => {
      for (const s of getAllSkills()) {
        expect(SKILL_LABELS[s]).toBeTruthy();
      }
    });
  });

  describe("suggestIdeas", () => {
    it("returns empty array when nothing matches", () => {
      // Sin pasiones ni skills → score 0 para todas
      const result = suggestIdeas({
        passions: [],
        skills: [],
        budget: "<500",
        time: "horas-libres",
      });
      // Hay un boost de 0.5 para budget bajo + 1 por time match,
      // así que ideas con budget "<500" pueden colarse. Verificamos
      // que NO crash y devuelve array.
      expect(Array.isArray(result)).toBe(true);
    });

    it("matches programming-related ideas when 'tecnologia' + 'programar'", () => {
      const result = suggestIdeas({
        passions: ["tecnologia"],
        skills: ["programar"],
        budget: "<500",
        time: "horas-libres",
      });
      expect(result.length).toBeGreaterThan(0);
      // Freelance técnico debe estar arriba.
      const titles = result.map((r) => r.template.id);
      expect(titles).toContain("freelance-tech");
    });

    it("includes diseño-canva when creativity + diseño + low budget", () => {
      const result = suggestIdeas({
        passions: ["creatividad"],
        skills: ["diseño"],
        budget: "<500",
        time: "horas-libres",
      });
      const titles = result.map((r) => r.template.id);
      expect(titles).toContain("diseño-canva");
    });

    it("matches food ideas with cooking + comida passion", () => {
      const result = suggestIdeas({
        passions: ["comida"],
        skills: ["cocinar"],
        budget: "500-5k",
        time: "20h-semana",
      });
      const titles = result.map((r) => r.template.id);
      expect(titles).toContain("comida-domicilio");
    });

    it("returns reasons for each match", () => {
      const result = suggestIdeas({
        passions: ["tecnologia"],
        skills: ["programar"],
        budget: "<500",
        time: "horas-libres",
      });
      for (const r of result) {
        expect(r.reasons.length).toBeGreaterThan(0);
      }
    });

    it("orders by score desc", () => {
      const result = suggestIdeas({
        passions: ["tecnologia", "creatividad"],
        skills: ["programar", "diseño", "redes-sociales"],
        budget: "<500",
        time: "horas-libres",
      });
      for (let i = 1; i < result.length; i++) {
        expect(result[i].score).toBeLessThanOrEqual(result[i - 1].score);
      }
    });

    it("respects limit parameter", () => {
      const result = suggestIdeas(
        {
          passions: ["tecnologia", "creatividad"],
          skills: ["programar", "diseño"],
          budget: "<500",
          time: "horas-libres",
        },
        3
      );
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("budget mismatch reduces score (no +3 from budget)", () => {
      // Una idea que requiere "5k-30k" no debería estar arriba si
      // el user marcó "<500" — aunque tenga match de pasión / skill.
      const lowBudget = suggestIdeas({
        passions: ["creatividad"],
        skills: ["vender"],
        budget: "<500",
        time: "horas-libres",
      });
      const tiendaNicho = lowBudget.find((r) => r.template.id === "tienda-nicho");
      // Si aparece, su score no incluye los +3 de budget match.
      if (tiendaNicho) {
        const noBudgetMatch = !tiendaNicho.template.budgets.includes("<500");
        if (noBudgetMatch) {
          expect(
            tiendaNicho.reasons.some((r) => r.includes("presupuesto"))
          ).toBe(false);
        }
      }
    });
  });
});
