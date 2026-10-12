import { ensureTable, sql } from "./_db.js";

const UUID = /^[0-9a-f-]{36}$/i;
const OSES = new Set(["macos", "windows", "linux"]);

async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response(null, { status: 405 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { id, os } = body;
  if (
    typeof id !== "string" ||
    !UUID.test(id) ||
    typeof os !== "string" ||
    !OSES.has(os)
  ) {
    return new Response(null, { status: 400 });
  }

  await ensureTable();
  await sql`
    INSERT INTO installs (install_id, os) VALUES (${id}, ${os})
    ON CONFLICT (install_id) DO UPDATE SET os = ${os}, last_seen = now()
  `;
  return new Response(null, { status: 204 });
}

export default { fetch: handle };
