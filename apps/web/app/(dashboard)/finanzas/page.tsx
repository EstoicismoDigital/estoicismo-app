import { FinanzasClient } from "./FinanzasClient";

// Auth guard lives in middleware.
export default function FinanzasPage() {
  return <FinanzasClient />;
}
