/**
 * Utilidades cliente para procesar imágenes antes de subir.
 *
 * Por qué:
 *  - HEIC: iPhone toma fotos en HEIC por default. Los browsers no lo
 *    decodifican nativo. Detectamos y, si es posible, lo convertimos
 *    a JPEG via heic2any (lazy import). Si falla, mostramos error
 *    útil al user.
 *  - Resize: portadas de libros no necesitan 4000px. Reducimos a
 *    máx 1200px lado largo + JPEG 85% para bajar peso ~10x.
 */

const MAX_LONG_SIDE = 1200;
const JPEG_QUALITY = 0.85;

export type ProcessedImage = {
  blob: Blob;
  ext: "jpg" | "png" | "webp" | "gif";
  /** Nombre de archivo limpio para guardar. */
  suggestedName: string;
};

/**
 * Procesa el archivo del input: convierte HEIC si hace falta, reduce
 * tamaño si es muy grande, y devuelve el Blob listo para upload.
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  const isHeic = isHeicFile(file);
  let blob: Blob = file;
  let ext: ProcessedImage["ext"] = "jpg";

  // 1. HEIC → JPEG via heic2any (lazy import, ~500KB)
  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: JPEG_QUALITY,
    });
    blob = Array.isArray(converted) ? converted[0] : converted;
    ext = "jpg";
  } else {
    // Detectar ext de mime type del File
    const type = file.type.toLowerCase();
    if (type.includes("png")) ext = "png";
    else if (type.includes("webp")) ext = "webp";
    else if (type.includes("gif")) ext = "gif";
    else ext = "jpg";
  }

  // 2. Resize si es muy grande (skip GIF para preservar animación)
  if (ext !== "gif") {
    blob = await resizeToMaxSide(blob, MAX_LONG_SIDE, JPEG_QUALITY);
    ext = "jpg"; // resize siempre re-encoda a JPEG
  }

  const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "image";
  return {
    blob,
    ext,
    suggestedName: `${baseName}.${ext}`,
  };
}

function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    type === "image/heic" ||
    type === "image/heif"
  );
}

/**
 * Reduce la imagen al lado más largo dado, manteniendo ratio.
 * Si ya es más chica, devuelve el blob original sin re-encodar.
 */
async function resizeToMaxSide(
  blob: Blob,
  maxSide: number,
  quality: number
): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (longest <= maxSide) return blob;
    const ratio = maxSide / longest;
    const w = Math.round(img.naturalWidth * ratio);
    const h = Math.round(img.naturalHeight * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;
    ctx.drawImage(img, 0, 0, w, h);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob falló"))),
        "image/jpeg",
        quality
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
