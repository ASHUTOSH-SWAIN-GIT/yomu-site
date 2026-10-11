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

/** On a Mac, whether the chip is Apple Silicon, where the browser says so
 * (Chrome does; Safari and Firefox keep it private). */
async function appleSilicon(): Promise<boolean | null> {
  try {
    const uad = (
      navigator as unknown as {
        userAgentData?: {
          getHighEntropyValues: (
            k: string[],
          ) => Promise<{ architecture?: string }>;
        };
      }
    ).userAgentData;
    const { architecture } =
      (await uad?.getHighEntropyValues(["architecture"])) ?? {};
    return architecture ? architecture === "arm" : null;
  } catch {
    return null;
  }
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
  const [arm, setArm] = useState<boolean | null>(null);
  const [more, setMore] = useState(false);
  // Kept mounted for a moment after closing so the menu can fade out.
  const [shown, setShown] = useState(false);
  const closing = shown && !open;
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlatform(detect());
    void latestAssets().then(setFiles);
    void appleSilicon().then(setArm);
  }, []);

  useEffect(() => {
    if (open) {
      setShown(true);
      return;
    }
    const t = setTimeout(() => setShown(false), 130);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    setMore(false);
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
  const others = GROUPS.filter((g) => g.id !== platform);
  const recommended = (platform: Platform, name: string) =>
    platform === "mac" &&
    arm !== null &&
    name === (arm ? "Apple Silicon" : "Intel");

  const group = (g: (typeof GROUPS)[number], first: boolean, offset = 0) => (
    <div
      key={g.id}
      className={first ? "" : "border-t border-[var(--color-line)]"}
    >
      <p className="text-muted px-4 pt-3 pb-1 font-mono text-[10px] tracking-[0.14em] uppercase">
        {g.label}
      </p>
      {g.items.map((it, n) => (
        <a
          key={it.name}
          style={{ animationDelay: `${60 + (offset + n) * 45}ms` }}
          role="menuitem"
          href={href(it.match)}
          onClick={() => setOpen(false)}
          className="item-in hover:bg-wash flex items-center gap-3 px-4 py-2.5"
        >
          <Download className="text-muted size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{it.name}</span>
            <span className="text-muted block text-xs">{it.note}</span>
          </span>
          {recommended(g.id, it.name) && (
            <span className="bg-ribbon/15 text-ribbon rounded-full px-2 py-0.5 text-[10px] font-medium">
              For your Mac
            </span>
          )}
        </a>
      ))}
    </div>
  );

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
      {(open || closing) && (
        <div
          role="menu"
          data-closing={closing}
          className={`pop bg-card text-ink absolute top-full z-40 mt-2 w-72 overflow-hidden rounded-xl text-left shadow-[0_0_0_1px_var(--color-line),0_20px_50px_-16px_rgb(0_0_0/0.35)] ${
            align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
          }`}
        >
          {group(here, true)}
          {more ? (
            others.map((g) => group(g, false))
          ) : (
            <button
              type="button"
              onClick={() => setMore(true)}
              className="text-muted hover:text-ink hover:bg-wash block w-full border-t border-[var(--color-line)] px-4 py-2.5 text-left text-xs"
            >
              Other platforms ({others.map((g) => g.label).join(", ")})
            </button>
          )}
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
