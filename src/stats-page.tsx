import { useEffect, useState, type FormEvent } from "react";

type Data = {
  totals: { total: number; active_30d: number };
  byOs: { label: string; n: number }[];
};

const KEY = "yomu-stats-password";
const read = () => {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};

/** Private dashboard at /stats. The password is checked by /api/stats, not
 * here; this page just holds it for the tab and sends it as a bearer token. */
export default function StatsPage() {
  const [password, setPassword] = useState(read);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!password) return;
    fetch("/api/stats", { headers: { Authorization: `Bearer ${password}` } })
      .then(async (r) => {
        if (r.status === 401) throw new Error("Wrong password.");
        if (!r.ok) throw new Error("Could not load the stats.");
        setData(await r.json());
        setError("");
        try {
          sessionStorage.setItem(KEY, password);
        } catch {
          // Only means asking again on reload.
        }
      })
      .catch((e: Error) => {
        setData(null);
        setError(e.message);
        setPassword("");
        try {
          sessionStorage.removeItem(KEY);
        } catch {
          // Nothing stored to remove.
        }
      });
  }, [password]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPassword(String(new FormData(e.currentTarget).get("password") ?? ""));
  }

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 px-4">
        <h1 className="text-xl font-semibold">Yomu stats</h1>
        <form onSubmit={submit} className="flex gap-2">
          <input
            name="password"
            type="password"
            autoFocus
            placeholder="Password"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button className="rounded-lg border px-4 py-2">Open</button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    );
  }

  const { total, active_30d } = data.totals;
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="text-xl font-semibold">Yomu stats</h1>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Total users" value={total} />
        <Tile label="Active in 30 days" value={active_30d} />
      </div>

      <section>
        <h2 className="mb-2 font-medium">By OS</h2>
        {data.byOs.length === 0 && (
          <p className="text-sm opacity-60">No data yet.</p>
        )}
        {data.byOs.map((r) => (
          <div
            key={r.label}
            className="flex justify-between border-b py-1 text-sm"
          >
            <span>{r.label}</span>
            <span className="tabular-nums">
              {r.n} ({total ? Math.round((r.n / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-sm opacity-70">{label}</div>
    </div>
  );
}
