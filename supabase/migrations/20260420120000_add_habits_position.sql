-- Add manual ordering to habits so users can prioritize their list.
-- Strategy:
--   - Add `position` as INT (nullable first), backfill per-user with row_number()
--     keyed on created_at so existing ordering is preserved.
--   - Then NOT NULL + DEFAULT 0 for new rows (inserts can override).
--   - Partial index over non-archived rows, scoped to user_id, keeps the
--     dashboard list query fast.

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS position INT;

-- Backfill: for each user, assign sequential positions 1..N ordered
-- by created_at ascending (matches the existing default ordering).
UPDATE public.habits AS h
SET position = sub.rn
FROM (
  SELECT
    id,
    row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
  FROM public.habits
) AS sub
WHERE h.id = sub.id
  AND h.position IS NULL;

-- Lock the column down for future inserts.
ALTER TABLE public.habits
  ALTER COLUMN position SET NOT NULL,
  ALTER COLUMN position SET DEFAULT 0;

-- Lookups always filter by user_id + is_archived; index both for the
-- common dashboard query ORDER BY position ASC.
CREATE INDEX IF NOT EXISTS habits_user_active_position_idx
  ON public.habits (user_id, position)
  WHERE is_archived = FALSE;
