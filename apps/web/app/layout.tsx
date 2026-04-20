import type { Metadata, Viewport } from "next";
import { Lora, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "../components/providers/QueryProvider";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: ["/favicon.svg"],
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

// Inline boot script: applies the `dark` class on <html> before React hydrates
// so the user never sees a flash of the wrong theme (FOUC).
// Kept as a string so Next.js inlines it verbatim.
const themeBootScript = `(function(){try{var s=localStorage.getItem('theme');var d;if(s==='dark'){d=true;}else if(s==='light'){d=false;}else{d=window.matchMedia('(prefers-color-scheme: dark)').matches;}if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${lora.variable} ${inter.variable} ${jetbrainsMono.variable}`}
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
