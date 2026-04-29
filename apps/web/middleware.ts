import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const PUBLIC_PATHS = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ];
  // `/` is the dashboard root — treated as protected (moved out of the
  // public list). This lets every dashboard page.tsx drop its own
  // Supabase client init + getUser() call, since middleware already
  // guards the route. Shaves one roundtrip per navigation.
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isOnboardingFlow = pathname.startsWith("/onboarding");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Gates de onboarding: el flujo es manifiesto → wizard (MPD).
  // Si NO ha firmado → /onboarding/manifiesto
  // Si firmó pero no tiene MPD → /onboarding/wizard
  // Si tiene ambos → continúa normal
  //
  // Fail-open: si las tablas no existen (porque todavía no se aplicó
  // la migración) o el query falla por cualquier razón, NO bloquea —
  // la app sigue funcionando como antes. Permite hacer deploy del
  // código frontend antes de la migración sin romper a usuarios.
  if (user && !isPublic && !isOnboardingFlow) {
    try {
      const { data: sig, error: sigErr } = await supabase
        .from("user_signed_manifesto")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!sigErr && !sig) {
        return NextResponse.redirect(
          new URL("/onboarding/manifiesto", request.url)
        );
      }

      // Solo chequea MPD si la firma existe
      if (sig) {
        const { data: mpd, error: mpdErr } = await supabase
          .from("mindset_mpd")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!mpdErr && !mpd) {
          return NextResponse.redirect(
            new URL("/onboarding/wizard", request.url)
          );
        }
      }
    } catch {
      // fail-open: continúa al dashboard
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
