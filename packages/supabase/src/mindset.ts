import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<Database, any, any>;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

/**
 * MPD — Propósito Mayor Definido (Napoleón Hill's "Definite Chief Aim").
 * Una sola fila por usuario; se actualiza in place.
 */
export type MindsetMPD = {
  id: string;
  user_id: string;
  aim: string;
  offered_value: string | null;
  deadline: string | null; // YYYY-MM-DD
  plan: string | null;
  affirmation: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Check-in diario sobre el MPD. Un registro por día por usuario.
 * Captura avance, estado emocional y confianza en el plan.
 */
export type MindsetMPDLog = {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  progress_note: string | null;
  mood: number | null; // 1-5
  belief: number | null; // 1-5
  read_affirmation: boolean;
  created_at: string;
  updated_at: string;
};

export type MeditationType =
  | "coherencia"
  | "romper-habito"
  | "ser-nuevo-yo"
  | "gratitud"
  | "vision"
  | "respiracion";

export type MindsetMeditation = {
  id: string;
  user_id: string;
  started_at: string;
  duration_seconds: number;
  meditation_type: MeditationType;
  intention: string | null;
  feeling_before: number | null; // 1-5
  feeling_after: number | null; // 1-5
  notes: string | null;
  created_at: string;
};

export type MindsetFrequencyFavorite = {
  id: string;
  user_id: string;
  frequency_key: string;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────

export type UpsertMPDInput = {
  aim: string;
  offered_value?: string | null;
  deadline?: string | null;
  plan?: string | null;
  affirmation?: string | null;
};

export type UpsertMPDLogInput = {
  date: string; // YYYY-MM-DD
  progress_note?: string | null;
  mood?: number | null;
  belief?: number | null;
  read_affirmation?: boolean;
};

export type CreateMeditationInput = {
  duration_seconds: number;
  meditation_type: MeditationType;
  intention?: string | null;
  feeling_before?: number | null;
  feeling_after?: number | null;
  notes?: string | null;
};

// ─────────────────────────────────────────────────────────────
// MPD
// ─────────────────────────────────────────────────────────────

export async function fetchMPD(sb: SB, userId: string): Promise<MindsetMPD | null> {
  const { data, error } = await sb
    .from("mindset_mpd")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as MindsetMPD | null;
}

/**
 * Crea o actualiza el MPD del usuario. Usa on-conflict por user_id
 * (unique constraint) para comportarse como upsert idempotente.
 */
export async function upsertMPD(
  sb: SB,
  userId: string,
  input: UpsertMPDInput
): Promise<MindsetMPD> {
  const { data, error } = await sb
    .from("mindset_mpd")
    .upsert(
      {
        user_id: userId,
        aim: input.aim,
        offered_value: input.offered_value ?? null,
        deadline: input.deadline ?? null,
        plan: input.plan ?? null,
        affirmation: input.affirmation ?? null,
      } as never,
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetMPD;
}

export async function deleteMPD(sb: SB, userId: string): Promise<void> {
  const { error } = await sb.from("mindset_mpd").delete().eq("user_id", userId);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// MPD LOGS
// ─────────────────────────────────────────────────────────────

export async function fetchMPDLogs(
  sb: SB,
  userId: string,
  opts: { from?: string; to?: string; limit?: number } = {}
): Promise<MindsetMPDLog[]> {
  let q = sb
    .from("mindset_mpd_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (opts.from) q = q.gte("date", opts.from);
  if (opts.to) q = q.lte("date", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as MindsetMPDLog[];
}

export async function fetchMPDLogForDate(
  sb: SB,
  userId: string,
  date: string
): Promise<MindsetMPDLog | null> {
  const { data, error } = await sb
    .from("mindset_mpd_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as MindsetMPDLog | null;
}

export async function upsertMPDLog(
  sb: SB,
  userId: string,
  input: UpsertMPDLogInput
): Promise<MindsetMPDLog> {
  const { data, error } = await sb
    .from("mindset_mpd_logs")
    .upsert(
      {
        user_id: userId,
        date: input.date,
        progress_note: input.progress_note ?? null,
        mood: input.mood ?? null,
        belief: input.belief ?? null,
        read_affirmation: input.read_affirmation ?? false,
      } as never,
      { onConflict: "user_id,date" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetMPDLog;
}

// ─────────────────────────────────────────────────────────────
// MEDITATIONS
// ─────────────────────────────────────────────────────────────

export async function fetchMeditations(
  sb: SB,
  userId: string,
  opts: { limit?: number } = {}
): Promise<MindsetMeditation[]> {
  let q = sb
    .from("mindset_meditations")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as MindsetMeditation[];
}

export async function createMeditation(
  sb: SB,
  userId: string,
  input: CreateMeditationInput
): Promise<MindsetMeditation> {
  const { data, error } = await sb
    .from("mindset_meditations")
    .insert({
      user_id: userId,
      duration_seconds: input.duration_seconds,
      meditation_type: input.meditation_type,
      intention: input.intention ?? null,
      feeling_before: input.feeling_before ?? null,
      feeling_after: input.feeling_after ?? null,
      notes: input.notes ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetMeditation;
}

export async function deleteMeditation(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("mindset_meditations").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// FREQUENCY FAVORITES
// ─────────────────────────────────────────────────────────────

export async function fetchFrequencyFavorites(
  sb: SB,
  userId: string
): Promise<MindsetFrequencyFavorite[]> {
  const { data, error } = await sb
    .from("mindset_frequency_favorites")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as unknown as MindsetFrequencyFavorite[];
}

export async function toggleFrequencyFavorite(
  sb: SB,
  userId: string,
  frequencyKey: string,
  isCurrentlyFavorite: boolean
): Promise<void> {
  if (isCurrentlyFavorite) {
    const { error } = await sb
      .from("mindset_frequency_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("frequency_key", frequencyKey);
    if (error) throw error;
  } else {
    const { error } = await sb
      .from("mindset_frequency_favorites")
      .insert({ user_id: userId, frequency_key: frequencyKey } as never);
    if (error) throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// VISION ITEMS · MOOD LOGS · FUTURE LETTERS
// ─────────────────────────────────────────────────────────────

export type VisionItemKind = "image" | "text" | "quote";

export type MindsetVisionItem = {
  id: string;
  user_id: string;
  kind: VisionItemKind;
  image_url: string | null;
  caption: string | null;
  category: string | null;
  position: number;
  weight: number | null;
  achieved: boolean;
  achieved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateVisionItemInput = {
  kind?: VisionItemKind;
  image_url?: string | null;
  caption?: string | null;
  category?: string | null;
  weight?: number | null;
};
export type UpdateVisionItemInput = Partial<CreateVisionItemInput> & {
  achieved?: boolean;
  position?: number;
};

export async function fetchVisionItems(
  sb: SB,
  userId: string,
  opts: { include_achieved?: boolean } = {}
): Promise<MindsetVisionItem[]> {
  let q = sb
    .from("mindset_vision_items")
    .select("*")
    .eq("user_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (opts.include_achieved === false) q = q.eq("achieved", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as MindsetVisionItem[];
}

export async function createVisionItem(
  sb: SB,
  userId: string,
  input: CreateVisionItemInput
): Promise<MindsetVisionItem> {
  const { data, error } = await sb
    .from("mindset_vision_items")
    .insert({
      user_id: userId,
      kind: input.kind ?? "image",
      image_url: input.image_url ?? null,
      caption: input.caption ?? null,
      category: input.category ?? null,
      weight: input.weight ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetVisionItem;
}

export async function updateVisionItem(
  sb: SB,
  id: string,
  input: UpdateVisionItemInput
): Promise<MindsetVisionItem> {
  const update: Record<string, unknown> = { ...input };
  if (input.achieved === true) update.achieved_at = new Date().toISOString();
  if (input.achieved === false) update.achieved_at = null;
  const { data, error } = await sb
    .from("mindset_vision_items")
    .update(update as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetVisionItem;
}

export async function deleteVisionItem(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("mindset_vision_items").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// MOOD LOGS
// ─────────────────────────────────────────────────────────────

export type MindsetMoodLog = {
  id: string;
  user_id: string;
  occurred_on: string;
  mood: number;
  energy: number | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertMoodLogInput = {
  occurred_on: string;
  mood: number;
  energy?: number | null;
  tags?: string[];
  notes?: string | null;
};

export async function fetchMoodLogs(
  sb: SB,
  userId: string,
  opts: { from?: string; to?: string; limit?: number } = {}
): Promise<MindsetMoodLog[]> {
  let q = sb
    .from("mindset_mood_logs")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false });
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as MindsetMoodLog[];
}

export async function fetchMoodLogForDate(
  sb: SB,
  userId: string,
  date: string
): Promise<MindsetMoodLog | null> {
  const { data, error } = await sb
    .from("mindset_mood_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("occurred_on", date)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as MindsetMoodLog | null;
}

export async function upsertMoodLog(
  sb: SB,
  userId: string,
  input: UpsertMoodLogInput
): Promise<MindsetMoodLog> {
  const { data, error } = await sb
    .from("mindset_mood_logs")
    .upsert(
      {
        user_id: userId,
        occurred_on: input.occurred_on,
        mood: input.mood,
        energy: input.energy ?? null,
        tags: input.tags ?? [],
        notes: input.notes ?? null,
      } as never,
      { onConflict: "user_id,occurred_on" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetMoodLog;
}

// ─────────────────────────────────────────────────────────────
// FUTURE LETTERS
// ─────────────────────────────────────────────────────────────

export type MindsetFutureLetter = {
  id: string;
  user_id: string;
  open_on: string;
  title: string | null;
  content: string;
  is_opened: boolean;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateFutureLetterInput = {
  open_on: string;
  title?: string | null;
  content: string;
};

export async function fetchFutureLetters(
  sb: SB,
  userId: string
): Promise<MindsetFutureLetter[]> {
  const { data, error } = await sb
    .from("mindset_future_letters")
    .select("*")
    .eq("user_id", userId)
    .order("open_on", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as MindsetFutureLetter[];
}

export async function createFutureLetter(
  sb: SB,
  userId: string,
  input: CreateFutureLetterInput
): Promise<MindsetFutureLetter> {
  const { data, error } = await sb
    .from("mindset_future_letters")
    .insert({
      user_id: userId,
      open_on: input.open_on,
      title: input.title ?? null,
      content: input.content,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetFutureLetter;
}

export async function openFutureLetter(
  sb: SB,
  id: string
): Promise<MindsetFutureLetter> {
  const { data, error } = await sb
    .from("mindset_future_letters")
    .update({ is_opened: true, opened_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetFutureLetter;
}

export async function deleteFutureLetter(sb: SB, id: string): Promise<void> {
  const { error } = await sb.from("mindset_future_letters").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// GRATITUDE — 3 cosas por día
// ─────────────────────────────────────────────────────────────

export type MindsetGratitude = {
  id: string;
  user_id: string;
  occurred_on: string;
  slot: number; // 1-3
  content: string;
  created_at: string;
  updated_at: string;
};

export type UpsertGratitudeInput = {
  occurred_on: string;
  slot: number;
  content: string;
};

export async function fetchGratitudeForDate(
  sb: SB,
  userId: string,
  date: string
): Promise<MindsetGratitude[]> {
  const { data, error } = await sb
    .from("mindset_gratitude")
    .select("*")
    .eq("user_id", userId)
    .eq("occurred_on", date)
    .order("slot", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as MindsetGratitude[];
}

export async function fetchGratitudeRange(
  sb: SB,
  userId: string,
  opts: { from?: string; to?: string; limit?: number } = {}
): Promise<MindsetGratitude[]> {
  let q = sb
    .from("mindset_gratitude")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("slot", { ascending: true });
  if (opts.from) q = q.gte("occurred_on", opts.from);
  if (opts.to) q = q.lte("occurred_on", opts.to);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as MindsetGratitude[];
}

export async function upsertGratitudeSlot(
  sb: SB,
  userId: string,
  input: UpsertGratitudeInput
): Promise<MindsetGratitude> {
  const { data, error } = await sb
    .from("mindset_gratitude")
    .upsert(
      {
        user_id: userId,
        occurred_on: input.occurred_on,
        slot: input.slot,
        content: input.content,
      } as never,
      { onConflict: "user_id,occurred_on,slot" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MindsetGratitude;
}

export async function deleteGratitudeSlot(
  sb: SB,
  userId: string,
  date: string,
  slot: number
): Promise<void> {
  const { error } = await sb
    .from("mindset_gratitude")
    .delete()
    .eq("user_id", userId)
    .eq("occurred_on", date)
    .eq("slot", slot);
  if (error) throw error;
}
