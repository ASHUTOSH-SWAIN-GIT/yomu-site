import { timingSafeEqual } from "node:crypto";
import { ensureTable, sql } from "./_db.js";

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
      count(*)::int AS total,
      count(*) FILTER (WHERE last_seen > now() - interval '30 days')::int AS active_30d
    FROM installs`;
  const byOs = await sql`
    SELECT os AS label, count(*)::int AS n
    FROM installs GROUP BY 1 ORDER BY 2 DESC`;

  return Response.json({ totals, byOs });
}

export default { fetch: handle };
