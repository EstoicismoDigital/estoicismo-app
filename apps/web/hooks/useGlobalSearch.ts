"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "../lib/supabase-client";

/**
 * useGlobalSearch · busca contenido del user en 5 fuentes en paralelo.
 *
 *   - Diario (journal_entries · title + content)
 *   - Libros (reading_books · title + author + my_summary + notes)
 *   - Ideas (business_ideas · title + description)
 *   - Transacciones (finance_transactions · note)
 *   - Conversaciones Pegasso (pegasso_messages · content)
 *
 * Implementación: ILIKE sobre cada tabla. RLS filtra por user_id.
 * Cada fuente devuelve top 5 resultados, total ~25.
 *
 * Activa solo cuando query.length >= 2 (corto = ruido).
 * staleTime breve para que cambios recientes aparezcan rápido.
 */

export type SearchHitKind =
  | "journal"
  | "book"
  | "idea"
  | "transaction"
  | "conversation";

export type SearchHit = {
  kind: SearchHitKind;
  id: string;
  title: string;
  snippet: string;
  /** href al cual navegar al hacer click. */
  href: string;
};

const PER_SOURCE_LIMIT = 5;

export function useGlobalSearch(query: string) {
  const q = query.trim();
  return useQuery<SearchHit[]>({
    queryKey: ["global-search", q],
    enabled: q.length >= 2,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const sb = getSupabaseBrowserClient();
      const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

      const [j, b, i, t, c] = await Promise.all([
        // 1. Journal
        sb
          .from("journal_entries")
          .select("id, title, content, occurred_on")
          .or(`title.ilike.${pattern},content.ilike.${pattern}`)
          .order("occurred_on", { ascending: false })
          .limit(PER_SOURCE_LIMIT),
        // 2. Books
        sb
          .from("reading_books")
          .select("id, title, author, my_summary, notes")
          .or(
            `title.ilike.${pattern},author.ilike.${pattern},my_summary.ilike.${pattern},notes.ilike.${pattern}`
          )
          .limit(PER_SOURCE_LIMIT),
        // 3. Ideas
        sb
          .from("business_ideas")
          .select("id, title, description")
          .or(`title.ilike.${pattern},description.ilike.${pattern}`)
          .limit(PER_SOURCE_LIMIT),
        // 4. Transactions
        sb
          .from("finance_transactions")
          .select("id, amount, kind, note, occurred_on")
          .ilike("note", pattern)
          .order("occurred_on", { ascending: false })
          .limit(PER_SOURCE_LIMIT),
        // 5. Pegasso conversations
        sb
          .from("pegasso_messages")
          .select("id, content, conversation_id, pegasso_conversations!inner(title)")
          .ilike("content", pattern)
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT),
      ]);

      const out: SearchHit[] = [];

      // Journal
      for (const row of j.data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any;
        out.push({
          kind: "journal",
          id: r.id,
          title: r.title || r.content.slice(0, 60),
          snippet: buildSnippet(r.content, q),
          href: `/notas?entry=${r.id}`,
        });
      }

      // Books
      for (const row of b.data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any;
        const text = r.my_summary || r.notes || `${r.author ?? ""}`;
        out.push({
          kind: "book",
          id: r.id,
          title: r.title,
          snippet: buildSnippet(text, q),
          href: `/habitos/lectura`,
        });
      }

      // Ideas
      for (const row of i.data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any;
        out.push({
          kind: "idea",
          id: r.id,
          title: r.title,
          snippet: buildSnippet(r.description ?? "", q),
          href: `/emprendimiento`,
        });
      }

      // Transactions
      for (const row of t.data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any;
        const sign = r.kind === "income" ? "+" : "-";
        out.push({
          kind: "transaction",
          id: r.id,
          title: r.note || "Sin nota",
          snippet: `${sign}$${Number(r.amount).toFixed(2)} · ${r.occurred_on}`,
          href: `/finanzas`,
        });
      }

      // Pegasso messages
      for (const row of c.data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any;
        const convTitle = r.pegasso_conversations?.title ?? "Conversación";
        out.push({
          kind: "conversation",
          id: r.id,
          title: convTitle,
          snippet: buildSnippet(r.content, q),
          href: `/pegasso`,
        });
      }

      return out;
    },
  });
}

function buildSnippet(text: string, q: string, around = 60): string {
  if (!text) return "";
  const lc = text.toLowerCase();
  const idx = lc.indexOf(q.toLowerCase());
  if (idx === -1) return text.slice(0, 140);
  const start = Math.max(0, idx - around);
  const end = Math.min(text.length, idx + q.length + around);
  let s = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) s = "…" + s;
  if (end < text.length) s = s + "…";
  return s;
}
