// AuthGuard in _layout.tsx owns all initial routing based on session state.
// Rendering null here lets the splash screen cover the blank state during resolution.
export default function Index() {
  return null;
}
