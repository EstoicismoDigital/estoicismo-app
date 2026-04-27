"use client";
import { useEffect, useState } from "react";
import { Coins, Loader2, Check } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useProfile } from "../../hooks/useProfile";
import { useUpdateProfile } from "../../hooks/useUpdateProfile";
import { COMMON_CURRENCIES } from "../../lib/currencies";

/**
 * Selector global de moneda. Aplica al crear cuentas, transacciones,
 * ventas, inversiones, productos. Las existentes mantienen su moneda
 * original.
 */
export function CurrencySelector() {
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    if (profile?.default_currency) {
      setDraft(profile.default_currency);
    }
  }, [profile?.default_currency]);

  if (isLoading) {
    return (
      <div className="rounded-card border border-line bg-bg p-5 flex items-center justify-center min-h-[120px]">
        <Loader2 size={18} className="animate-spin text-muted" />
      </div>
    );
  }

  const current = profile?.default_currency ?? "MXN";

  async function save(code: string) {
    if (code === current) return;
    try {
      await update.mutateAsync({ default_currency: code });
      toast.success(`Moneda guardada · ${code}`, {
        description: "Aplica al crear cuentas, transacciones y ventas nuevas.",
      });
    } catch (err) {
      toast.error("No se pudo guardar.", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="rounded-card border border-line bg-bg p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Coins size={18} className="text-accent shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <h3 className="font-body text-sm font-medium text-ink">
            Moneda preferida
          </h3>
          <p className="font-body text-xs text-muted leading-relaxed mt-1">
            Default al crear cuentas, transacciones, ventas, inversiones,
            productos. Lo existente mantiene su moneda.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COMMON_CURRENCIES.map((c) => {
          const active = c.code === current;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => save(c.code)}
              disabled={update.isPending}
              className={clsx(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full border font-mono text-[10px] uppercase tracking-widest transition-colors",
                active
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-line bg-bg-alt/40 text-muted hover:text-ink hover:border-line-strong"
              )}
              title={c.label}
            >
              {active && <Check size={11} />}
              <span>{c.symbol}</span>
              {c.code}
            </button>
          );
        })}
      </div>

      {/* Custom input para códigos no comunes */}
      <div className="flex items-center gap-2 pt-2 border-t border-line">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted shrink-0">
          ¿Otra?
        </p>
        <input
          type="text"
          value={draft}
          onChange={(e) =>
            setDraft(e.target.value.toUpperCase().slice(0, 5))
          }
          onBlur={() => {
            if (draft && draft !== current && draft.length >= 3) save(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          placeholder="ISO 4217 (ej. KRW)"
          className="flex-1 rounded-md border border-line bg-bg-alt px-3 py-1.5 font-mono text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent uppercase"
        />
      </div>
    </div>
  );
}
