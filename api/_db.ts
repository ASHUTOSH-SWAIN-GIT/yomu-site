import { neon } from "@neondatabase/serverless";

// One row per install. install_id is a random UUID the app makes for itself,
// so nothing here points back to a person.
export const sql = neon(process.env.DATABASE_URL!);

let ready: Promise<unknown> | null = null;
export function ensureTable() {
  ready ??= sql`
    CREATE TABLE IF NOT EXISTS installs (
      install_id TEXT PRIMARY KEY,
      os         TEXT NOT NULL,
      first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  return ready;
}
