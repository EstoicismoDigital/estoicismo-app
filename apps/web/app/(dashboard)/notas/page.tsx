import { NotasClient } from "./NotasClient";

// Auth guard lives in middleware.
export default function NotasPage() {
  return <NotasClient />;
}
