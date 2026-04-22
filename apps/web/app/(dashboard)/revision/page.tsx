import { RevisionClient } from "./RevisionClient";

// Auth guard lives in middleware.
export default function RevisionPage() {
  return <RevisionClient />;
}
