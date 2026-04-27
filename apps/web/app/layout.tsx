import type { Metadata, Viewport } from "next";
import { Lora, Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "../components/providers/QueryProvider";
import "./globals.css";

/**
 * Tipografía:
 *  - **Lora** (serif) — marca. Solo para títulos/headings (`font-display`).
 *  - **Montserrat** (sans) — resto de la interfaz. Cargada con todos los
 *    pesos que usamos (400 descripciones, 500 menú, 600 menú activo,
 *    700 títulos-sans) + itálicas 400/500 para énfasis puntual.
 *
 * Ambas expuestas como CSS variables y mapeadas en tailwind.config.ts:
 *   font-display  → Lora
 *   font-body     → Montserrat
 *   font-mono     → Montserrat (reemplaza JetBrains para unificar marca)
 */
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Estoicismo Digital — Tu sistema de transformación personal",
    template: "%s · Estoicismo Digital",
  },
  description:
    "Hábitos, finanzas, mentalidad y emprendimiento en un solo sistema. Para el hispano moderno.",
  applicationName: "Estoicismo Digital",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Estoicismo",
    statusBarStyle: "black-translucent",
  },
  icons: {
    // Logo oficial Estoicismo Digital — Marco Aurelio en círculo.
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon-32.png"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5EFE0" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1014" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Inline boot script: applies the `dark` class AND the stored palette
// class on <html> before React hydrates so the user never sees a flash
// of the wrong theme (FOUC). Kept as a string so Next.js inlines it
// verbatim; `PALETTE_IDS` must stay in sync with usePalette.ts.
//
// Default fallback es 'negro'. Los IDs legacy (bronce/grafito/bosque/
// lavanda/coral) son inválidos ahora → caen a 'negro'. Los usuarios que
// tenían 'rosa' guardada siguen en rosa.
const PALETTE_IDS = ["negro", "rosa"] as const;
const FONT_SIZE_IDS = ["small", "normal", "large", "xl"] as const;
const themeBootScript = `(function(){try{var s=localStorage.getItem('theme');var d;if(s==='dark'){d=true;}else if(s==='light'){d=false;}else{d=window.matchMedia('(prefers-color-scheme: dark)').matches;}var h=document.documentElement;if(d){h.classList.add('dark');}var valid=${JSON.stringify(PALETTE_IDS)};var p=localStorage.getItem('palette');if(valid.indexOf(p)===-1){p='negro';}h.classList.add('palette-'+p);var fs=localStorage.getItem('fontSize');var fsv=${JSON.stringify(FONT_SIZE_IDS)};if(fsv.indexOf(fs)===-1){fs='normal';}h.classList.add('font-'+fs);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${lora.variable} ${montserrat.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="bg-bg text-ink font-body antialiased">
        <QueryProvider>
          {children}
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
