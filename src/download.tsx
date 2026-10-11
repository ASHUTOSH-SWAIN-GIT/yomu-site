import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";

const REPO = "ASHUTOSH-SWAIN-GIT/Yomu";
const RELEASES = `https://github.com/${REPO}/releases/latest`;

type Platform = "mac" | "windows" | "linux";

/** What each platform offers. `match` finds the file in the latest release,
 * so a new version needs no change here. */
const GROUPS: {
  id: Platform;
  label: string;
  items: { name: string; note: string; match: RegExp }[];
}[] = [
  {
    id: "mac",
    label: "macOS",
    items: [
      { name: "Apple Silicon", note: "M1, M2, M3, M4", match: /aarch64\.dmg$/ },
      { name: "Intel", note: "x86_64", match: /x64\.dmg$/ },
    ],
  },
  {
    id: "windows",
    label: "Windows",
    items: [
      { name: "Installer", note: "64-bit .exe", match: /x64-setup\.exe$/ },
      { name: "MSI", note: "64-bit .msi", match: /x64_en-US\.msi$/ },
    ],
  },
  {
    id: "linux",
    label: "Linux",
    items: [
      { name: "AppImage", note: "Runs anywhere", match: /\.AppImage$/ },
      { name: "Debian, Ubuntu", note: ".deb", match: /\.deb$/ },
      { name: "Fedora, RHEL", note: ".rpm", match: /\.rpm$/ },
    ],
  },
];

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "linux";
  return "mac";
}

let assets: Promise<{ name: string; url: string }[]> | null = null;
/** The files of the latest release, asked for once. Without them (offline,
 * rate limited) every link falls back to the release page. */
function latestAssets() {
  assets ??= fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((j: { assets: { name: string; browser_download_url: string }[] }) =>
      j.assets.map((a) => ({ name: a.name, url: a.browser_download_url })),
    )
    .catch(() => []);
  return assets;
}

/** A download button with the choices for each platform in a menu. */
export function DownloadMenu({
  size = "lg",
  label,
  align = "center",
}: {
  size?: "sm" | "lg";
  /** Replaces "Download for {platform}". */
  label?: string;
  align?: "center" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("mac");
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlatform(detect());
    void latestAssets().then(setFiles);
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const href = (match: RegExp) =>
    files.find((f) => match.test(f.name))?.url ?? RELEASES;
  const here = GROUPS.find((g) => g.id === platform)!;
  const ordered = [here, ...GROUPS.filter((g) => g.id !== platform)];

  return (
    <div ref={root} className="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`bg-ink text-paper inline-flex items-center gap-2 font-medium hover:opacity-90 ${
          size === "lg"
            ? "rounded-lg px-5 py-3 text-sm shadow-[0_8px_24px_-10px_rgb(30_27_23/0.6)]"
            : "rounded-md px-3.5 py-1.5 text-sm"
        }`}
      >
        {label ?? `Download for ${here.label}`}
        <ChevronDown
          className={`size-4 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          className={`bg-card text-ink absolute top-full z-40 mt-2 w-72 overflow-hidden rounded-xl text-left shadow-[0_0_0_1px_var(--color-line),0_20px_50px_-16px_rgb(0_0_0/0.35)] ${
            align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
          }`}
        >
          {ordered.map((g, i) => (
            <div
              key={g.id}
              className={i > 0 ? "border-t border-[var(--color-line)]" : ""}
            >
              <p className="text-muted px-4 pt-3 pb-1 font-mono text-[10px] tracking-[0.14em] uppercase">
                {g.label}
              </p>
              {g.items.map((it) => (
                <a
                  key={it.name}
                  role="menuitem"
                  href={href(it.match)}
                  onClick={() => setOpen(false)}
                  className="hover:bg-wash flex items-center gap-3 px-4 py-2.5"
                >
                  <Download className="text-muted size-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{it.name}</span>
                    <span className="text-muted block text-xs">{it.note}</span>
                  </span>
                </a>
              ))}
            </div>
          ))}
          <a
            href={RELEASES}
            className="text-muted hover:text-ink hover:bg-wash block border-t border-[var(--color-line)] px-4 py-2.5 text-xs"
          >
            All downloads and release notes
          </a>
        </div>
      )}
    </div>
  );
}
