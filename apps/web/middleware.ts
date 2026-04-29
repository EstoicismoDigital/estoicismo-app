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

  // Gate del manifiesto: si el user está autenticado y NO ha firmado,
  // redirige a /onboarding/manifiesto. Excepción: rutas del propio
  // flujo de onboarding y rutas públicas.
  //
  // Fail-open: si la tabla user_signed_manifesto no existe (porque
  // todavía no se aplicó la migración) o el query falla por cualquier
  // razón, NO bloquea — la app sigue funcionando como antes. Esto
  // permite hacer deploy del código frontend antes de la migración
  // sin romper a usuarios existentes.
  if (user && !isPublic && !isOnboardingFlow) {
    try {
      const { data: sig, error } = await supabase
        .from("user_signed_manifesto")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Si la tabla no existe (42P01) o cualquier otro error, fail-open.
      if (!error && !sig) {
        return NextResponse.redirect(
          new URL("/onboarding/manifiesto", request.url)
        );
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
