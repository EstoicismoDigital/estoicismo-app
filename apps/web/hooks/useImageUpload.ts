"use client";
import { useState } from "react";
import { toast } from "sonner";
import { processImageFile } from "../lib/image-utils";
import { getSupabaseBrowserClient } from "../lib/supabase-client";
import { uploadUserFile } from "@estoicismo/supabase";
import { extractErrorMessage } from "../lib/errors";

/**
 * Hook simple para subir imágenes a un bucket público de Supabase
 * Storage. Maneja: HEIC conversion, resize, errores.
 *
 * Uso:
 *   const { upload, isUploading } = useImageUpload();
 *   const url = await upload(file, { bucket: "book-covers", purpose: "cover" });
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  async function upload(
    file: File,
    opts: { bucket: string; purpose?: string }
  ): Promise<string | null> {
    setIsUploading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        toast.error("Necesitas iniciar sesión para subir archivos.");
        return null;
      }

      const processed = await processImageFile(file);
      const result = await uploadUserFile(sb, opts.bucket, user.id, processed.blob, {
        purpose: opts.purpose ?? "image",
        ext: processed.ext,
      });
      return result.publicUrl;
    } catch (err) {
      toast.error("No pude subir la imagen.", {
        description: extractErrorMessage(err),
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading };
}
