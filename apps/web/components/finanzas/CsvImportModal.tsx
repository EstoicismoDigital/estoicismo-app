"use client";
import { useMemo, useState } from "react";
import {
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import {
  parseCsv,
  guessMapping,
  parseRow,
  type FieldKey,
  type ParsedTransaction,
} from "../../lib/finance/csv-import";
import {
  useCreateTransaction,
  useFinanceCategories,
} from "../../hooks/useFinance";
import type { FinanceCategory } from "@estoicismo/supabase";

const FIELD_OPTIONS: { value: FieldKey; label: string }[] = [
  { value: "ignore", label: "— Ignorar —" },
  { value: "date", label: "Fecha" },
  { value: "amount", label: "Monto (con signo)" },
  { value: "amount_in", label: "Ingreso" },
  { value: "amount_out", label: "Gasto" },
  { value: "kind", label: "Tipo (income/expense)" },
  { value: "description", label: "Descripción" },
  { value: "category", label: "Categoría" },
];

/**
 * CSV Import Modal · 3 pasos:
 *   1. Drop file / paste content
 *   2. Mapping de columnas + preview
 *   3. Import con progress
 */
export function CsvImportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"upload" | "map" | "importing" | "done">(
    "upload"
  );
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey>>({});
  const [imported, setImported] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [errors, setErrors] = useState(0);

  const { data: categories = [] } = useFinanceCategories();
  const createTx = useCreateTransaction();

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        toast.error("CSV vacío o ilegible");
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(guessMapping(parsed.headers));
      setStep("map");
    };
    reader.onerror = () => toast.error("No se pudo leer el archivo");
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // Preview: primeras 5 filas parseadas
  const preview = useMemo(() => {
    return rows
      .slice(0, 5)
      .map((r) => parseRow(r, mapping))
      .filter((p): p is ParsedTransaction => p !== null);
  }, [rows, mapping]);

  const validRowCount = useMemo(() => {
    return rows.filter((r) => parseRow(r, mapping) !== null).length;
  }, [rows, mapping]);

  async function runImport() {
    setStep("importing");
    let imp = 0;
    let skp = 0;
    let err = 0;

    for (const row of rows) {
      const parsed = parseRow(row, mapping);
      if (!parsed) {
        skp += 1;
        continue;
      }
      // Match category by hint or default to first of kind
      const cat = matchCategory(categories, parsed.categoryHint, parsed.kind);
      if (!cat) {
        skp += 1;
        continue;
      }
      try {
        await createTx.mutateAsync({
          amount: parsed.amount,
          kind: parsed.kind,
          category_id: cat.id,
          occurred_on: parsed.date,
          note: parsed.description,
          source: "import",
        });
        imp += 1;
      } catch {
        err += 1;
      }
    }

    setImported(imp);
    setSkipped(skp);
    setErrors(err);
    setStep("done");
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-bg rounded-card border border-line shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-line shrink-0">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
              Importar CSV
            </p>
            <h3 className="font-display italic text-xl text-ink">
              {step === "upload" && "Sube tu archivo"}
              {step === "map" && "Mapea las columnas"}
              {step === "importing" && "Importando…"}
              {step === "done" && "Listo"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-bg-alt flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === "upload" && (
            <div className="space-y-4">
              <p className="font-body text-sm text-muted leading-relaxed">
                Sube un CSV exportado de tu banco. Detectamos delimitador
                (`,` `;` `	`) y mapeo automáticamente; tú confirmas o
                ajustas antes de importar.
              </p>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-line rounded-card p-10 text-center bg-bg-alt/30 hover:bg-bg-alt/60 transition-colors"
              >
                <Upload size={28} className="mx-auto text-muted mb-3" />
                <p className="font-body text-sm text-ink mb-3">
                  Arrastra un CSV aquí, o
                </p>
                <label className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-accent text-bg font-body text-sm font-medium hover:opacity-90 cursor-pointer">
                  <Upload size={14} /> Selecciona archivo
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {step === "map" && (
            <div className="space-y-4">
              <p className="font-body text-sm text-muted leading-relaxed">
                {rows.length} filas detectadas. Confirma el mapping de
                columnas — campos requeridos: <strong>fecha</strong> y
                <strong> monto</strong> (o ingreso/gasto separados).
              </p>

              {/* Mapping table */}
              <div className="rounded-lg border border-line bg-bg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-alt">
                    <tr>
                      <th className="text-left p-2.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                        Columna CSV
                      </th>
                      <th className="text-left p-2.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                        Mapear a
                      </th>
                      <th className="text-left p-2.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                        Ejemplo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((h) => (
                      <tr key={h} className="border-t border-line">
                        <td className="p-2.5 font-body text-ink truncate max-w-[150px]">
                          {h}
                        </td>
                        <td className="p-2.5">
                          <select
                            value={mapping[h] ?? "ignore"}
                            onChange={(e) =>
                              setMapping({
                                ...mapping,
                                [h]: e.target.value as FieldKey,
                              })
                            }
                            className="rounded border border-line bg-bg-alt px-2 py-1 text-xs text-ink focus:outline-none focus:border-accent w-full"
                          >
                            {FIELD_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5 font-mono text-[10px] text-muted truncate max-w-[150px]">
                          {rows[0]?.[h] ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                    Vista previa (primeras 5 filas válidas)
                  </p>
                  <ul className="space-y-1.5">
                    {preview.map((p, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-line bg-bg p-2.5 flex items-center gap-2"
                      >
                        <span
                          className={clsx(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            p.kind === "income"
                              ? "bg-success"
                              : "bg-danger"
                          )}
                        />
                        <span className="font-mono text-[10px] text-muted">
                          {p.date}
                        </span>
                        <span className="font-body text-xs text-ink truncate flex-1">
                          {p.description ?? "(sin descripción)"}
                        </span>
                        <span
                          className={clsx(
                            "font-mono tabular-nums text-xs",
                            p.kind === "income"
                              ? "text-success"
                              : "text-danger"
                          )}
                        >
                          {p.kind === "income" ? "+" : "-"}
                          {p.amount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validRowCount === 0 && (
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 flex items-start gap-2">
                  <AlertCircle
                    size={14}
                    className="text-danger shrink-0 mt-0.5"
                  />
                  <p className="font-body text-xs text-ink">
                    Ninguna fila pasó el parsing. Revisa que tengas mapeada
                    una columna de fecha y otra de monto.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="text-center py-12">
              <Loader2 size={28} className="mx-auto animate-spin text-accent mb-3" />
              <p className="font-body text-sm text-muted">
                Creando transacciones… Por favor no cierres esta ventana.
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2
                size={36}
                className="mx-auto text-success"
              />
              <div>
                <p className="font-display italic text-2xl text-ink mb-1">
                  Import completo
                </p>
                <p className="font-body text-sm text-muted">
                  {imported} importadas · {skipped} omitidas
                  {errors > 0 && ` · ${errors} con error`}
                </p>
              </div>
            </div>
          )}
        </div>

        {(step === "map" || step === "done") && (
          <div className="p-4 border-t border-line flex items-center justify-end gap-2 shrink-0">
            {step === "map" && (
              <>
                <button
                  onClick={() => setStep("upload")}
                  className="h-10 px-4 rounded-lg font-body text-sm text-muted hover:text-ink hover:bg-bg-alt"
                >
                  Atrás
                </button>
                <button
                  onClick={runImport}
                  disabled={validRowCount === 0}
                  className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-accent text-bg font-body text-sm font-medium hover:opacity-90 disabled:opacity-40"
                >
                  Importar {validRowCount}{" "}
                  {validRowCount === 1 ? "transacción" : "transacciones"}
                  <ArrowRight size={14} />
                </button>
              </>
            )}
            {step === "done" && (
              <button
                onClick={onClose}
                className="h-10 px-5 rounded-lg bg-accent text-bg font-body text-sm font-medium hover:opacity-90"
              >
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function matchCategory(
  categories: FinanceCategory[],
  hint: string | null,
  kind: "income" | "expense"
): FinanceCategory | null {
  if (hint) {
    const normalized = hint.toLowerCase();
    // Match exacto por nombre
    const exact = categories.find(
      (c) => c.kind === kind && c.name.toLowerCase() === normalized
    );
    if (exact) return exact;
    // Match por keyword
    const keywordMatch = categories.find(
      (c) =>
        c.kind === kind &&
        c.keywords?.some((k) => normalized.includes(k.toLowerCase()))
    );
    if (keywordMatch) return keywordMatch;
  }
  // Fallback: primera categoría del kind
  return categories.find((c) => c.kind === kind) ?? null;
}
