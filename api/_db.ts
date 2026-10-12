import { neon } from "@neondatabase/serverless";

// One row per event. install_id is a random UUID the app makes for itself, so
// nothing here points back to a person.
export const sql = neon(process.env.DATABASE_URL!);

let ready: Promise<unknown> | null = null;
export function ensureTable() {
  ready ??= sql`
    CREATE TABLE IF NOT EXISTS events (
      id         BIGSERIAL PRIMARY KEY,
      install_id TEXT NOT NULL,
      event      TEXT NOT NULL,
      version    TEXT NOT NULL,
      os         TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `.then(
    () =>
      sql`CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at)`,
  );
  return ready;
}
