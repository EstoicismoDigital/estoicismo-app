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

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Onboarding (manifiesto + wizard) ahora es OPCIONAL — el usuario
  // puede acceder al dashboard libremente y completarlo cuando quiera
  // desde un banner en /hoy. Esto evita que un usuario quede bloqueado
  // si la migración aún no se aplicó o si simplemente quiere explorar
  // la app antes de comprometerse a firmar/llenar el MPD.
  //
  // Si en el futuro se quiere obligar de nuevo, restaurar los gates
  // aquí — pero recomendado solo para usuarios nuevos, con flag por
  // cuenta (created_at > X).

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
