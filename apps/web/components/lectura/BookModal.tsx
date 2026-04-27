"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, BookOpen, Loader2, Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import type { ReadingBook, CreateBookInput, UpdateBookInput } from "@estoicismo/supabase";
import { useImageUpload } from "../../hooks/useImageUpload";

export function BookModal(props: {
  open: boolean;
  book?: ReadingBook | null;
  onClose: () => void;
  onSave: (input: CreateBookInput | UpdateBookInput) => Promise<void> | void;
  saving?: boolean;
}) {
  const { open, book, onClose, onSave, saving } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [totalPages, setTotalPages] = useState(book?.total_pages ? String(book.total_pages) : "");
  const [currentPage, setCurrentPage] = useState(book?.current_page ? String(book.current_page) : "0");
  const [coverUrl, setCoverUrl] = useState(book?.cover_url ?? "");
  const [category, setCategory] = useState(book?.category ?? "");
  const [isCurrent, setIsCurrent] = useState(book?.is_current ?? !book);
  const [mySummary, setMySummary] = useState(book?.my_summary ?? "");
  const [notes, setNotes] = useState(book?.notes ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload();

  useEffect(() => {
    if (!open) return;
    setTitle(book?.title ?? "");
    setAuthor(book?.author ?? "");
    setTotalPages(book?.total_pages ? String(book.total_pages) : "");
    setCurrentPage(book?.current_page ? String(book.current_page) : "0");
    setCoverUrl(book?.cover_url ?? "");
    setCategory(book?.category ?? "");
    setIsCurrent(book?.is_current ?? !book);
    setMySummary(book?.my_summary ?? "");
    setNotes(book?.notes ?? "");
  }, [open, book]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, { bucket: "book-covers", purpose: "cover" });
    if (url) setCoverUrl(url);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-bg-alt sm:rounded-modal rounded-t-modal max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-alt/95 border-b border-line px-5 py-3 flex items-center justify-between">
          <h2 className="font-display italic text-lg text-ink">
            {book ? "Editar libro" : "Nuevo libro"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-line/50 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {/* Cover upload — primero porque es lo más visual */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
              Portada
            </label>
            <div className="flex items-start gap-3">
              {/* Preview */}
              <div className="relative w-20 h-28 rounded-lg overflow-hidden bg-bg border border-line shrink-0 flex items-center justify-center">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt="Portada"
                    className="w-full h-full object-cover"
                    onError={() => setCoverUrl("")}
                  />
                ) : (
                  <ImageIcon size={20} className="text-muted/40" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="flex-1 space-y-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-3 rounded-lg bg-bg border border-line hover:border-accent text-ink text-sm transition-colors disabled:opacity-40"
                >
                  <Camera size={14} />
                  {coverUrl ? "Cambiar foto" : "Subir foto"}
                </button>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="w-full inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg text-muted hover:text-danger text-xs transition-colors"
                  >
                    <Trash2 size={12} />
                    Quitar
                  </button>
                )}
                <p className="text-[10px] text-muted leading-relaxed">
                  JPG, PNG, HEIC, WebP — máx 10MB. Se redimensiona
                  automáticamente.
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meditaciones"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Autor
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Marco Aurelio"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Páginas totales
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="288"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
                Página actual
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                placeholder="0"
                className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Categoría
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Filosofía, novela, ensayo…"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-ink">Marcar como mi libro actual</span>
          </label>

          {/* Aprendizajes — el corazón de cada libro */}
          <div className="pt-4 border-t border-line/50">
            <label className="block text-[11px] font-mono uppercase tracking-widest text-accent mb-1">
              ✦ Lo más importante que aprendí
            </label>
            <p className="text-[11px] text-muted leading-relaxed mb-2">
              La razón por la que leíste este libro. Las 3-5 ideas que
              cambiaron tu cabeza, lo que le dirías a un amigo si tuvieras
              un minuto. <strong className="text-ink/80">Esto es lo que
              vas a releer dentro de un año</strong> — no las páginas
              originales.
            </p>
            <textarea
              value={mySummary}
              onChange={(e) => setMySummary(e.target.value)}
              rows={6}
              placeholder={`1. La idea principal del libro es…\n2. Lo que más me marcó fue…\n3. Voy a aplicar esto en mi vida así…`}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink resize-none focus:outline-none focus:border-accent leading-relaxed"
            />
          </div>

          {/* Citas y notas adicionales — opcional */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-1">
              Citas favoritas <span className="text-muted/60">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Páginas a recordar, frases textuales que quieras guardar."
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink resize-none focus:outline-none focus:border-accent text-sm"
            />
          </div>
        </div>
        <div className="border-t border-line px-5 py-3 flex justify-end gap-2 sticky bottom-0 bg-bg-alt/95">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-line text-muted hover:text-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!title.trim() || saving || isUploading}
            onClick={async () => {
              if (!title.trim()) return;
              await onSave({
                title: title.trim(),
                author: author.trim() || null,
                total_pages: totalPages !== "" ? Number(totalPages) : null,
                current_page: currentPage !== "" ? Number(currentPage) : 0,
                cover_url: coverUrl.trim() || null,
                category: category.trim() || null,
                is_current: isCurrent,
                my_summary: mySummary.trim() || null,
                notes: notes.trim() || null,
              });
            }}
            className={clsx(
              "px-5 py-2 rounded-lg bg-accent text-bg font-mono text-[11px] uppercase tracking-widest",
              "hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
            {book ? "Guardar" : "Agregar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
