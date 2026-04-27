"use client";
import { useState } from "react";
import {
  Check,
  X,
  Loader2,
  DollarSign,
  Target,
  PenLine,
  Lightbulb,
  CircleDashed,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import type { SuggestedAction } from "@estoicismo/supabase";
import { useQueryClient } from "@tanstack/react-query";

const KIND_META: Record<
  SuggestedAction["kind"],
  { icon: React.ReactNode; label: string; accent: string }
> = {
  create_transaction: {
    icon: <DollarSign size={14} />,
    label: "Transacción",
    accent: "text-success",
  },
  create_habit: {
    icon: <Target size={14} />,
    label: "Hábito",
    accent: "text-accent",
  },
  create_journal_entry: {
    icon: <PenLine size={14} />,
    label: "Nota",
    accent: "text-accent",
  },
  create_business_idea: {
    icon: <Lightbulb size={14} />,
    label: "Idea",
    accent: "text-warning",
  },
};

export function SuggestedActionCard({
  messageId,
  action,
}: {
  messageId: string;
  action: SuggestedAction;
}) {
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const qc = useQueryClient();
  const meta = KIND_META[action.kind];

  async function handle(decision: "confirm" | "cancel") {
    if (busy || action.status !== "pending") return;
    setBusy(decision);
    try {
      const res = await fetch("/api/pegasso/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          action_id: action.id,
          decision,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo procesar");
        return;
      }
      // Invalidar queries relevantes
      if (decision === "confirm") {
        toast.success(
          action.kind === "create_transaction"
            ? "Transacción creada"
            : action.kind === "create_habit"
              ? "Hábito creado"
              : action.kind === "create_journal_entry"
                ? "Nota guardada"
                : "Idea guardada"
        );
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["habits"] });
        qc.invalidateQueries({ queryKey: ["journal"] });
        qc.invalidateQueries({ queryKey: ["business"] });
      }
      // Refetch los mensajes para reflejar el nuevo status
      qc.invalidateQueries({ queryKey: ["pegasso", "messages"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  const isPending = action.status === "pending";
  const isConfirmed = action.status === "confirmed";
  const isCancelled = action.status === "cancelled";

  return (
    <div
      className={clsx(
        "mt-2 rounded-lg border p-3 flex items-center gap-3 transition-colors",
        isPending && "border-line bg-bg",
        isConfirmed && "border-success/30 bg-success/5",
        isCancelled && "border-line/40 bg-bg/40 opacity-60"
      )}
    >
      <div
        className={clsx(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          isPending ? "bg-bg-alt" : "bg-bg/40",
          meta.accent
        )}
      >
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
          {isPending && (
            <>
              <CircleDashed
                size={9}
                className="inline mr-1"
                aria-hidden
              />
              Sugerencia · {meta.label}
            </>
          )}
          {isConfirmed && (
            <>
              <CheckCircle2
                size={9}
                className="inline mr-1 text-success"
                aria-hidden
              />
              Creada · {meta.label}
            </>
          )}
          {isCancelled && (
            <>
              <XCircle size={9} className="inline mr-1" aria-hidden />
              Descartada · {meta.label}
            </>
          )}
        </p>
        <p
          className={clsx(
            "font-body text-sm truncate",
            isCancelled ? "text-muted line-through" : "text-ink"
          )}
        >
          {action.summary}
        </p>
      </div>

      {isPending && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handle("cancel")}
            disabled={!!busy}
            aria-label="Cancelar"
            title="Cancelar"
            className="h-8 w-8 rounded-md text-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors disabled:opacity-40"
          >
            {busy === "cancel" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
          </button>
          <button
            type="button"
            onClick={() => handle("confirm")}
            disabled={!!busy}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {busy === "confirm" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
}
