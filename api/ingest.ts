import { ensureTable, sql } from "./_db";

const EVENTS = new Set(["app_open", "article_added", "pdf_added", "chat_sent"]);
const UUID = /^[0-9a-f-]{36}$/i;
const SHORT = /^[\w.+-]{1,32}$/;

async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response(null, { status: 405 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { id, event, version, os } = body;
  if (
    typeof id !== "string" || !UUID.test(id) ||
    typeof event !== "string" || !EVENTS.has(event) ||
    typeof version !== "string" || !SHORT.test(version) ||
    typeof os !== "string" || !SHORT.test(os)
  ) {
    return new Response(null, { status: 400 });
  }

  await ensureTable();
  await sql`
    INSERT INTO events (install_id, event, version, os)
    VALUES (${id}, ${event}, ${version}, ${os})
  `;
  return new Response(null, { status: 204 });
}

export default { fetch: handle };
