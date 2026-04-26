-- ============================================================
-- BUSINESS_IDEAS · meta JSONB
-- ============================================================
--
-- Columna `meta` en business_ideas para guardar el output del
-- nuevo Idea Validator: ikigai scores, cascada de "5 whys",
-- pre-mortem, y datos de exploración. Estructura libre — el
-- cliente la define y nosotros sólo la persistimos.
--
-- Forma esperada (no enforced en SQL):
--   {
--     "kind": "have-idea" | "exploring",
--     "ikigai": { "love": 1-5, "good_at": 1-5, "needed": 1-5, "paid_for": 1-5 },
--     "whys": ["why1", "why2", "why3", "why4", "why5"],
--     "premortem": "...",
--     "energy_gives": ["..."], "energy_drains": ["..."],
--     "free_8h": "...",
--     "called_to_help": "...",
--     "frustrating_problem": "..."
--   }
-- ============================================================

ALTER TABLE public.business_ideas
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Index sobre kind para filtros rápidos en la UI.
CREATE INDEX IF NOT EXISTS business_ideas_meta_kind_idx
  ON public.business_ideas USING BTREE ((meta->>'kind'));
