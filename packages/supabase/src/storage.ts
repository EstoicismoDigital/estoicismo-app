/**
 * Storage helpers — uploads de archivos del user a buckets públicos.
 *
 * Convención de paths: <bucket>/<user_id>/<purpose>-<timestamp>.<ext>
 * RLS: el user solo puede CRUD en su propio folder (chequeo en la
 * policy via storage.foldername(name)[1] = auth.uid()).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, any, any>;

// El paquete no tiene `dom` en su lib (solo ES2022). En vez de pelear
// con la config compartida, declaramos lo mínimo que necesitamos.
// El runtime real lo provee el browser; el caller pasa File o Blob.
type FileLike = {
  name?: string;
  type?: string;
  size?: number;
};
type BlobLike = {
  type?: string;
  size?: number;
};

export type UploadResult = {
  path: string;
  publicUrl: string;
};

/**
 * Sube un archivo al bucket especificado bajo el folder del user.
 * Retorna el public URL listo para usarse en `<img src>`.
 *
 * Si el bucket no existe o el archivo excede el tamaño máximo, lanza
 * el error de Supabase Storage tal cual — el caller decide cómo
 * mostrarlo (típicamente un toast).
 */
export async function uploadUserFile(
  sb: SB,
  bucket: string,
  userId: string,
  file: FileLike | BlobLike,
  opts: {
    /** Sufijo descriptivo. Ej. "book-cover", "avatar". Default "file". */
    purpose?: string;
    /** Extensión sin punto. Si no se da, se infiere del File.name. */
    ext?: string;
  } = {}
): Promise<UploadResult> {
  const purpose = opts.purpose ?? "file";
  const fileName = (file as FileLike).name;
  const ext =
    opts.ext ??
    (fileName && fileName.includes(".")
      ? fileName.split(".").pop()!.toLowerCase()
      : "bin");
  const filename = `${purpose}-${Date.now()}-${Math.floor(
    Math.random() * 10_000
  )}.${ext}`;
  const path = `${userId}/${filename}`;

  const { error } = await sb.storage
    .from(bucket)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upload(path, file as any, {
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;

  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/**
 * Borra un archivo previamente subido. Path es el que viene en
 * UploadResult. Si el archivo no existe, no falla.
 */
export async function deleteUserFile(
  sb: SB,
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await sb.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * Extrae el path interno del bucket a partir de un public URL.
 * Útil cuando solo guardas la URL en la DB y luego quieres borrar
 * el archivo.
 *
 * Ej: https://xxx.supabase.co/storage/v1/object/public/book-covers/<user>/<file>
 *     → "<user>/<file>"
 */
export function pathFromPublicUrl(
  bucket: string,
  publicUrl: string
): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return null;
  return publicUrl.slice(idx + marker.length);
}
