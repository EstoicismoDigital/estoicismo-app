/**
 * Layout para el flujo de onboarding (manifiesto + wizard).
 * Sin top nav, bottom nav, ni QuickCaptureFab — el usuario está
 * en flujo de set-up, no debe distraerse con el shell del dashboard.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bg">{children}</div>;
}
