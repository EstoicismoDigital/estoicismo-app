"use client";
import { useMemo } from "react";
import { Users, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_ORDER,
  type ClientStatus,
  type BusinessClient,
} from "@estoicismo/supabase";
import { useUpdateClient } from "../../hooks/useBusiness";

const STATUS_COLORS: Record<ClientStatus, string> = {
  lead: "bg-muted/15 text-muted",
  contactado: "bg-warning/15 text-warning",
  cliente: "bg-success/15 text-success",
  recurrente: "bg-accent/15 text-accent",
  perdido: "bg-danger/15 text-danger",
};

/**
 * Pipeline · CRM lite por status.
 *
 * Muestra cada cliente con su status como badge y botón siguiente
 * para avanzar en el pipeline. Los archivados no aparecen.
 *
 * No es un kanban arrastrable (overhead innecesario para móvil).
 * En vez, un solo botón "→" que avanza al siguiente status.
 */
export function ClientPipelineCard({
  clients,
}: {
  clients: BusinessClient[];
}) {
  const update = useUpdateClient();

  const grouped = useMemo(() => {
    const out = new Map<ClientStatus, BusinessClient[]>();
    for (const s of CLIENT_STATUS_ORDER) out.set(s, []);
    for (const c of clients) {
      const status = (c.status ?? "cliente") as ClientStatus;
      out.get(status)?.push(c);
    }
    return out;
  }, [clients]);

  function nextStatus(s: ClientStatus): ClientStatus | null {
    const idx = CLIENT_STATUS_ORDER.indexOf(s);
    // No auto-avanzar a "perdido" (siempre manual)
    if (idx < 0 || idx >= CLIENT_STATUS_ORDER.length - 2) return null;
    return CLIENT_STATUS_ORDER[idx + 1];
  }

  if (clients.length === 0) return null;

  return (
    <section className="rounded-card border border-line bg-bg p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-accent" />
          <h2 className="font-display italic text-lg text-ink">Pipeline</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {clients.length} contactos
        </span>
      </header>

      <div className="space-y-4">
        {CLIENT_STATUS_ORDER.map((status) => {
          const list = grouped.get(status) ?? [];
          if (list.length === 0) return null;
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={clsx(
                    "inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-widest",
                    STATUS_COLORS[status]
                  )}
                >
                  {CLIENT_STATUS_LABELS[status]}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {list.length}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <ul className="space-y-1">
                {list.map((c) => {
                  const next = nextStatus(status);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-bg-alt transition-colors group"
                    >
                      <span className="font-body text-sm text-ink truncate flex-1">
                        {c.name}
                      </span>
                      {c.tag && (
                        <span className="font-mono text-[10px] text-muted px-1.5 py-0.5 rounded bg-bg-alt">
                          {c.tag}
                        </span>
                      )}
                      {next && (
                        <button
                          type="button"
                          onClick={() =>
                            update.mutate({
                              id: c.id,
                              input: { status: next },
                            })
                          }
                          aria-label={`Avanzar a ${CLIENT_STATUS_LABELS[next]}`}
                          title={`Avanzar a ${CLIENT_STATUS_LABELS[next]}`}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-full text-muted hover:text-ink hover:bg-bg flex items-center justify-center transition-all"
                        >
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
