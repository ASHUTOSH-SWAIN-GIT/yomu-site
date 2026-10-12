import { timingSafeEqual } from "node:crypto";
import { ensureTable, sql } from "./_db";

function passwordOk(given: string): boolean {
  const want = process.env.STATS_PASSWORD ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return want.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  if (!passwordOk(auth.replace(/^Bearer /, ""))) {
    return new Response(null, { status: 401 });
  }

  await ensureTable();
  const [totals] = await sql`
    SELECT
      count(DISTINCT install_id) AS installs,
      count(DISTINCT install_id) FILTER (WHERE created_at > now() - interval '1 day')   AS dau,
      count(DISTINCT install_id) FILTER (WHERE created_at > now() - interval '7 days')  AS wau,
      count(DISTINCT install_id) FILTER (WHERE created_at > now() - interval '30 days') AS mau
    FROM events`;
  const newPerDay = await sql`
    SELECT to_char(first_seen, 'YYYY-MM-DD') AS day, count(*)::int AS n
    FROM (SELECT install_id, min(created_at) AS first_seen FROM events GROUP BY 1) f
    WHERE first_seen > now() - interval '30 days'
    GROUP BY 1 ORDER BY 1`;
  const activePerDay = await sql`
    SELECT to_char(created_at, 'YYYY-MM-DD') AS day, count(DISTINCT install_id)::int AS n
    FROM events WHERE created_at > now() - interval '30 days'
    GROUP BY 1 ORDER BY 1`;
  const byVersion = await sql`
    SELECT version AS label, count(DISTINCT install_id)::int AS n
    FROM events WHERE created_at > now() - interval '30 days'
    GROUP BY 1 ORDER BY 2 DESC`;
  const byOs = await sql`
    SELECT os AS label, count(DISTINCT install_id)::int AS n
    FROM events WHERE created_at > now() - interval '30 days'
    GROUP BY 1 ORDER BY 2 DESC`;
  const usage = await sql`
    SELECT event AS label, count(*)::int AS n
    FROM events WHERE created_at > now() - interval '30 days' AND event <> 'app_open'
    GROUP BY 1 ORDER BY 2 DESC`;

  return Response.json({ totals, newPerDay, activePerDay, byVersion, byOs, usage });
}

export default { fetch: handle };
