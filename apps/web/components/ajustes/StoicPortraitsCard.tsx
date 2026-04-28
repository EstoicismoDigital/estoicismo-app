"use client";
import { useRef, useState } from "react";
import { Camera, Loader2, Check, ImageIcon, Trash2 } from "lucide-react";
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
 * compartidos (públicos) — no por-user. La idea: el dueño de la
 * app sube las 4 imágenes una vez y todos los users las ven.
 */

type Stoic = {
  slug: string;
  philosopher: string;
  module: string;
  color: string;
};

const STOICS: Stoic[] = [
  {
    slug: "epicteto",
    philosopher: "Epicteto",
    module: "Hábitos",
    color: "#B48A28",
  },
  {
    slug: "marco-aurelio",
    philosopher: "Marco Aurelio",
    module: "Finanzas",
    color: "#22774E",
  },
  {
    slug: "seneca",
    philosopher: "Séneca",
    module: "Emprendimiento",
    color: "#1E58A3",
  },
  {
    slug: "porcia",
    philosopher: "Porcia Catón",
    module: "Mentalidad",
    color: "#B2443A",
  },
];

function publicUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // Cache buster simple para que después de subir, la nueva imagen
  // se vea inmediatamente sin tener que esperar al cache.
  return `${base}/storage/v1/object/public/stoic-portraits/${slug}.jpg?t=${Date.now()}`;
}

export function StoicPortraitsCard() {
  return (
    <div className="rounded-card border border-line bg-bg p-5">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon size={14} className="text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Retratos de los estoicos
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="font-body text-xs text-muted leading-relaxed mb-4">
        Las imágenes que aparecen en el grid de módulos de /hoy. Sube
        cada una una sola vez — todos los users las verán. Si ninguna
        está cargada, el grid muestra un monograma con la inicial.
      </p>

      <div className="grid grid-cols-2 gap-3">
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
    <div
      className="relative aspect-[3/4] rounded-lg overflow-hidden border border-line"
      style={{ background: `${stoic.color}15` }}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: stoic.color }}
      />

      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-white" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1.5">
        <div>
          <p
            className="font-mono text-[8px] uppercase tracking-widest"
            style={{ color: stoic.color }}
          >
            {stoic.module}
          </p>
          <p className="font-display italic text-white text-sm leading-tight">
            {stoic.philosopher}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={clsx(
              "flex-1 inline-flex items-center justify-center gap-1 h-7 px-2 rounded",
              "bg-white/10 text-white font-mono text-[9px] uppercase tracking-widest",
              "hover:bg-white/20 backdrop-blur-sm disabled:opacity-40 transition-colors"
            )}
          >
            <Camera size={10} />
            Subir
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Eliminar"
            className="h-7 w-7 rounded bg-white/10 text-white hover:bg-danger/40 backdrop-blur-sm disabled:opacity-40 transition-colors flex items-center justify-center"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

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
