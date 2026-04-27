"use client";
import Link from "next/link";
import { Coins } from "lucide-react";
import { useDefaultCurrency } from "../../hooks/useDefaultCurrency";
import { getCurrencyMeta } from "../../lib/currencies";

/**
 * Badge pequeño que muestra la moneda preferida del user. Click →
 * /ajustes con anchor a Currency. Visible en el hero de /finanzas
 * y /emprendimiento para que el user sepa qué moneda está usando.
 */
export function CurrencyBadge() {
  const code = useDefaultCurrency();
  const meta = getCurrencyMeta(code);

  return (
    <Link
      href="/ajustes#finanzas-y-negocio"
      title={`Moneda: ${meta.label}. Cambiar en Ajustes.`}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-colors"
    >
      <Coins size={11} />
      <span>{meta.symbol}</span>
      {code}
    </Link>
  );
}
