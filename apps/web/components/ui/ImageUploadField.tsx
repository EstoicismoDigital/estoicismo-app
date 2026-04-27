"use client";
import { useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { useImageUpload } from "../../hooks/useImageUpload";

/**
 * Campo reutilizable para subir imágenes a Supabase Storage.
 *
 * Reemplaza el patrón viejo de `<input type="url">` que generaba
 * resistencia (¿de dónde saca el user un URL público?). Acepta JPG,
 * PNG, HEIC, WebP, GIF — convierte HEIC a JPEG y redimensiona.
 *
 * Uso:
 *   <ImageUploadField
 *     value={coverUrl}
 *     onChange={setCoverUrl}
 *     bucket="book-covers"
 *     purpose="cover"
 *     label="Portada"
 *     aspectRatio="portrait"   // "square" | "portrait" | "landscape"
 *   />
 */
export function ImageUploadField({
  value,
  onChange,
  bucket,
  purpose = "image",
  label,
  helper,
  aspectRatio = "square",
  size = "md",
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  bucket: string;
  purpose?: string;
  label?: string;
  helper?: string;
  aspectRatio?: "square" | "portrait" | "landscape";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file, { bucket, purpose });
    if (url) onChange(url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const previewSize = {
    sm: { square: "h-16 w-16", portrait: "h-20 w-14", landscape: "h-14 w-20" },
    md: { square: "h-24 w-24", portrait: "h-28 w-20", landscape: "h-20 w-28" },
    lg: { square: "h-32 w-32", portrait: "h-40 w-28", landscape: "h-28 w-40" },
  }[size][aspectRatio];

  return (
    <div className={className}>
      {label && (
        <label className="block text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
          {label}
        </label>
      )}
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div
          className={clsx(
            "relative rounded-lg overflow-hidden bg-bg border border-line shrink-0 flex items-center justify-center",
            previewSize
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
              onError={() => onChange("")}
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
        <div className="flex-1 min-w-0 space-y-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full inline-flex items-center justify-center gap-2 h-10 px-3 rounded-lg bg-bg border border-line hover:border-accent text-ink text-sm transition-colors disabled:opacity-40"
          >
            <Camera size={14} />
            {value ? "Cambiar foto" : "Subir foto"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="w-full inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg text-muted hover:text-danger text-xs transition-colors"
            >
              <Trash2 size={12} />
              Quitar
            </button>
          )}
          {helper && (
            <p className="text-[10px] text-muted leading-relaxed">{helper}</p>
          )}
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
  );
}
