"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  HeartOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { clsx } from "clsx";
import {
  FREQUENCY_PRESETS,
  FREQUENCY_CATEGORY_LABELS,
  type FrequencyCategory,
  type FrequencyPreset,
} from "../../../../lib/mindset";
import {
  useFrequencyFavorites,
  useToggleFrequencyFavorite,
} from "../../../../hooks/useMindset";

/**
 * Mentalidad · Aura.
 *
 * Reproductor de frecuencias con Web Audio API. Sintetiza un tono
 * sinusoidal puro en el Hz solicitado — Solfeggio, binaural mono, y
 * resonancia Schumann. El usuario elige categoría (concentración,
 * meditación, enfoque, relajación…), selecciona una frecuencia, y
 * reproduce con volumen ajustable + fade in/out para no dañar el oído.
 *
 * Implementación:
 *  - Un solo AudioContext por sesión (lazy init en la primera
 *    interacción — requisito de Chrome autoplay policy).
 *  - Un OscillatorNode por reproducción: se para al soltar; crear uno
 *    nuevo al reanudar (los oscillators no son reutilizables).
 *  - GainNode constante con rampa lineal para evitar clicks al
 *    iniciar/detener.
 *  - Sin ArrayBuffer pre-grabado — todo generado. Cero peso de red.
 */

export function AuraClient() {
  const [category, setCategory] = useState<FrequencyCategory | "all" | "favs">(
    "all"
  );

  const [playing, setPlaying] = useState<FrequencyPreset | null>(null);
  const [volume, setVolume] = useState(0.2); // 0..1
  const [muted, setMuted] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const { data: favorites = [] } = useFrequencyFavorites();
  const toggleFav = useToggleFrequencyFavorite();
  const favKeys = useMemo(
    () => new Set(favorites.map((f) => f.frequency_key)),
    [favorites]
  );

  const categories: (FrequencyCategory | "all" | "favs")[] = useMemo(
    () => [
      "all",
      "favs",
      "concentracion",
      "enfoque",
      "meditacion",
      "relajacion",
      "sanacion",
      "creatividad",
      "sueno",
    ],
    []
  );

  const list = useMemo<FrequencyPreset[]>(() => {
    if (category === "all") return FREQUENCY_PRESETS;
    if (category === "favs")
      return FREQUENCY_PRESETS.filter((f) => favKeys.has(f.key));
    return FREQUENCY_PRESETS.filter((f) => f.category === category);
  }, [category, favKeys]);

  // Volumen live (para que el slider sea fluido)
  useEffect(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (ctx && gain) {
      const target = muted ? 0 : volume;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.05);
    }
  }, [volume, muted]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopInternal();
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopInternal() {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    const osc = oscRef.current;
    if (ctx && gain && osc) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
      try {
        osc.stop(now + 0.2);
      } catch {
        // ya detenido
      }
    }
    oscRef.current = null;
    gainRef.current = null;
  }

  async function startFrequency(preset: FrequencyPreset) {
    // Detén la anterior si existe
    stopInternal();

    if (!ctxRef.current) {
      // Lazy init — requiere gesto de usuario (este click cuenta).
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) {
        alert("Tu navegador no soporta Web Audio API.");
        return;
      }
      ctxRef.current = new Ctx();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(preset.hz, ctx.currentTime);

    const gain = ctx.createGain();
    const target = muted ? 0 : volume;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    oscRef.current = osc;
    gainRef.current = gain;
    setPlaying(preset);
  }

  function stopFrequency() {
    stopInternal();
    setPlaying(null);
  }

  function handleToggle(preset: FrequencyPreset) {
    if (playing?.key === preset.key) {
      stopFrequency();
    } else {
      void startFrequency(preset);
    }
  }

  async function handleToggleFav(preset: FrequencyPreset) {
    await toggleFav.mutateAsync({
      frequencyKey: preset.key,
      isCurrentlyFavorite: favKeys.has(preset.key),
    });
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
            Aura · Frecuencias
          </p>
          <h1 className="font-display italic text-3xl sm:text-4xl leading-tight">
            Sintoniza tu estado con un Hz elegido.
          </h1>
          <p className="font-body text-white/60 text-sm mt-3 max-w-prose leading-relaxed">
            Solfeggio, binaurales y la resonancia Schumann —
            sintetizadas aquí con un tono sinusoidal puro. Úsalas con
            auriculares, volumen bajo. Cierra los ojos y respira.
          </p>
        </div>
      </section>

      {/* Filtros */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const label =
              c === "all"
                ? "Todas"
                : c === "favs"
                ? "Favoritas"
                : FREQUENCY_CATEGORY_LABELS[c];
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={clsx(
                  "whitespace-nowrap h-9 px-4 rounded-full font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                  active
                    ? "bg-accent text-bg"
                    : "bg-bg-alt text-muted border border-line hover:text-ink"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Lista */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-28 sm:pb-24">
        {list.length === 0 ? (
          <div className="rounded-card border border-line bg-bg-alt/40 p-8 text-center">
            <p className="font-body text-sm text-muted">
              {category === "favs"
                ? "Aún no tienes favoritas. Toca el corazón de cualquier frecuencia."
                : "No hay frecuencias para este filtro."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map((f) => {
              const isPlaying = playing?.key === f.key;
              const isFav = favKeys.has(f.key);
              return (
                <li
                  key={f.key}
                  className={clsx(
                    "rounded-card border p-4 flex flex-col gap-2 transition-colors",
                    isPlaying
                      ? "border-accent bg-accent/5"
                      : "border-line bg-bg-alt/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display italic text-xl text-ink leading-none">
                        {f.label}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">
                        {FREQUENCY_CATEGORY_LABELS[f.category]}
                        {f.brainwave && ` · ${f.brainwave}`} · {f.origin}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleFav(f)}
                      aria-label={isFav ? "Quitar de favoritas" : "Añadir a favoritas"}
                      className={clsx(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                        isFav
                          ? "text-accent hover:text-accent/80"
                          : "text-muted hover:text-ink"
                      )}
                    >
                      {isFav ? <Heart size={14} fill="currentColor" /> : <HeartOff size={14} />}
                    </button>
                  </div>

                  <p className="font-body text-xs text-muted leading-relaxed">
                    {f.summary}
                  </p>

                  <button
                    onClick={() => handleToggle(f)}
                    className={clsx(
                      "mt-2 inline-flex items-center justify-center gap-2 h-10 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-all",
                      isPlaying
                        ? "bg-accent text-bg hover:opacity-90"
                        : "border border-line bg-bg text-ink hover:border-accent/40"
                    )}
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={12} /> Detener
                      </>
                    ) : (
                      <>
                        <Play size={12} /> Reproducir
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Reproductor flotante */}
      {playing && (
        <div
          role="region"
          aria-label="Reproductor de frecuencia"
          className="fixed left-0 right-0 bottom-14 md:bottom-0 z-40 bg-bg-alt/95 backdrop-blur-sm border-t border-accent/30"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-display italic text-base text-ink leading-none">
                {playing.label}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-accent mt-1">
                Reproduciendo · {FREQUENCY_CATEGORY_LABELS[playing.category]}
              </p>
            </div>
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              className="flex-shrink-0 w-9 h-9 rounded-full text-muted hover:text-ink transition-colors flex items-center justify-center"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (muted) setMuted(false);
              }}
              aria-label="Volumen"
              className="w-20 sm:w-32 accent-accent"
            />
            <button
              onClick={stopFrequency}
              aria-label="Detener"
              className="flex-shrink-0 w-9 h-9 rounded-full bg-accent text-bg hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              <Pause size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
