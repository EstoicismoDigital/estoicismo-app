"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Upload } from "lucide-react";

const CsvImportModal = dynamic(
  () =>
    import("./CsvImportModal").then((m) => ({ default: m.CsvImportModal })),
  { ssr: false }
);

/**
 * Trigger del importador CSV. Modal lazy-loaded para no agregar peso
 * a /ajustes hasta que el user lo necesite.
 */
export function CsvImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg border border-line text-ink font-body text-sm hover:bg-bg-alt hover:border-accent/30 transition-colors w-full sm:w-auto self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Upload size={16} />
        Importar CSV
      </button>
      {open && <CsvImportModal onClose={() => setOpen(false)} />}
    </>
  );
}
