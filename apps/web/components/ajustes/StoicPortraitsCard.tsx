"use client";
import { useRef, useState } from "react";
import { Camera, Loader2, ImageIcon, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "../../lib/supabase-client";
import { processImageFile } from "../../lib/image-utils";

/**
 * StoicPortraitsCard · admin tool para subir las imágenes que
 * aparecen en el ModuleGridNav de /hoy.
 *
 * Sube directo al bucket `stoic-portraits` con slug fijo
 * (epicteto.jpg, marco-aurelio.jpg, etc.). Reemplaza el archivo
 * anterior con upsert.
 *
 * Cualquier user authenticated puede subir. Los archivos son
 * compartidos (públicos) — no por-user.
 */

type Stoic = {
  slug: string;
  philosopher: string;
  module: string;
  color: string;
};

const STOICS: Stoic[] = [
  { slug: "epicteto", philosopher: "Epicteto", module: "Hábitos", color: "#B48A28" },
  { slug: "marco-aurelio", philosopher: "Marco Aurelio", module: "Finanzas", color: "#22774E" },
  { slug: "seneca", philosopher: "Séneca", module: "Emprendimiento", color: "#1E58A3" },
  { slug: "porcia", philosopher: "Porcia Catón", module: "Mentalidad", color: "#B2443A" },
];

function publicUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/stoic-portraits/${slug}.jpg?t=${Date.now()}`;
}

export function StoicPortraitsCard() {
  return (
    <div className="rounded-card border border-line bg-bg p-5">
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Retratos de los estoicos
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="font-body text-xs text-muted leading-relaxed mb-4">
        Compartidos por toda la comunidad. Cuando un admin sube un retrato, todos
        los users lo ven en el grid de módulos de /hoy.
      </p>

      <div className="grid grid-cols-4 gap-3">
        {STOICS.map((s) => (
          <PortraitSlot key={s.slug} stoic={s} />
        ))}
      </div>
    </div>
  );
}

function PortraitSlot({ stoic }: { stoic: Stoic }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const processed = await processImageFile(file);
      const { error } = await sb.storage
        .from("stoic-portraits")
        .upload(`${stoic.slug}.jpg`, processed.blob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
        });
      if (error) throw error;
      toast.success(`${stoic.philosopher} actualizado`);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error("No pude subir el retrato", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!confirm(`¿Eliminar el retrato de ${stoic.philosopher}?`)) return;
    setUploading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const { error } = await sb.storage
        .from("stoic-portraits")
        .remove([`${stoic.slug}.jpg`]);
      if (error) throw error;
      toast.success("Retrato removido");
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error("No pude eliminar", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative aspect-square w-full max-w-[88px] rounded-full overflow-hidden border-2"
        style={{ borderColor: stoic.color, background: `${stoic.color}15` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={version}
          src={publicUrl(stoic.slug)}
          alt={stoic.philosopher}
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 size={16} className="animate-spin text-white" />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label={`Subir retrato de ${stoic.philosopher}`}
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors group"
        >
          <Camera size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <p className="font-mono text-[9px] uppercase tracking-widest text-muted text-center leading-tight">
        {stoic.philosopher}
      </p>
      <button
        type="button"
        onClick={handleRemove}
        disabled={uploading}
        aria-label={`Eliminar ${stoic.philosopher}`}
        className={clsx(
          "h-5 w-5 rounded text-muted hover:text-danger transition-colors flex items-center justify-center",
          uploading && "opacity-40"
        )}
      >
        <Trash2 size={10} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
