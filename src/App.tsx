import { useEffect, useState, type ReactNode } from "react";
import { DownloadMenu, detect } from "./download";
import { CopyCommand } from "./copy";
import { Brackets, Frame, Gutters, Stats, Tag } from "./grid";
import { Reveal } from "./reveal";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  HardDrive,
  KeyRound,
  Link2,
  MessageSquare,
  Moon,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  Type,
  Bookmark,
  Database,
} from "lucide-react";

/** GitHub's mark (lucide no longer ships brand icons). */
function Github({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const REPO = "https://github.com/ASHUTOSH-SWAIN-GIT/Yomu";
const VERSION = "v0.1.2";

/** The page sits between two vertical rails, like a ruled notebook. */
function Rails({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto max-w-6xl border-x border-[var(--color-line)] ${className}`}
    >
      {children}
    </div>
  );
}

function Label({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="text-muted font-mono text-[11px] tracking-[0.14em] uppercase">
      <span className="text-ribbon">{n}</span> / {children}
    </p>
  );
}

/** Light or dark, saved once the visitor picks; until then it follows the
 * system. `index.html` applies it before the first paint. */
function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      if (!localStorage.getItem("theme")) setDark(media.matches);
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode: the choice just lasts for this visit.
    }
  };
  return { dark, toggle };
}

/** A real screenshot of the app, in the site's current theme: both are in
 * the page and CSS shows the one that matches. */
function Shot({
  name,
  alt,
  width,
  height,
  eager,
}: {
  name: string;
  alt: string;
  width: number;
  height: number;
  eager?: boolean;
}) {
  const img = (theme: "light" | "dark", className: string) => (
    <img
      src={`/shots/${name}-${theme}.jpg`}
      alt={theme === "light" ? alt : ""}
      aria-hidden={theme === "dark" || undefined}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      className={`block h-auto w-full ${className}`}
    />
  );
  return (
    <div className="bg-frame w-full overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--color-line),0_30px_70px_-30px_rgb(0_0_0/0.45)]">
      <div className="flex h-7 items-center gap-1.5 px-3">
        <i className="size-2.5 rounded-full bg-[#ff5f57]" />
        <i className="size-2.5 rounded-full bg-[#febc2e]" />
        <i className="size-2.5 rounded-full bg-[#28c840]" />
      </div>
      {img("light", "dark:hidden")}
      {img("dark", "hidden dark:block")}
    </div>
  );
}

function Nav() {
  const { dark, toggle } = useTheme();
  return (
    <header className="fade-down bg-paper/80 sticky top-0 z-30 border-b border-[var(--color-line)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <a href="#" className="flex items-center gap-2 font-semibold">
          <img src="/icon.png" alt="" className="size-6" />
          Yomu
        </a>
        <nav className="text-muted hidden gap-6 text-sm sm:flex">
          <a href="#features" className="hover:text-ink">
            Features
          </a>
          <a href="#settings" className="hover:text-ink">
            Settings
          </a>
          <a href="#agents" className="hover:text-ink">
            Agents
          </a>
          <a href="#local" className="hover:text-ink">
            Privacy
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={REPO}
            className="text-muted hover:text-ink hidden items-center gap-1.5 px-2 text-sm sm:flex"
          >
            <Github className="size-4" /> GitHub
          </a>
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
            className="text-muted hover:text-ink hover:bg-wash grid size-8 place-items-center rounded-md"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <DownloadMenu size="sm" label="Download" align="right" />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  // Only Mac visitors need the note; everyone else sees the platforms.
  const [mac, setMac] = useState(true);
  useEffect(() => setMac(detect() === "mac"), []);
  return (
    <section className="border-b border-[var(--color-line)]">
      <Rails className="px-5 pt-20 pb-16 text-center sm:pt-28">
        <a
          href={`${REPO}/releases`}
          className="rise bg-card text-muted hover:text-ink inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 font-mono text-[11px] shadow-[0_0_0_1px_var(--color-line)]"
        >
          <span className="bg-ink text-paper rounded-full px-2 py-0.5">
            {VERSION}
          </span>
          free · open source · local first
          <ArrowRight className="size-3" />
        </a>
        <Frame className="-mx-5 mt-9 px-5 py-9 sm:py-11">
          <h1 className="mx-auto max-w-4xl font-display text-[2.9rem] leading-[1.04] font-normal tracking-[-0.04em] sm:text-[5rem]">
            <span className="block">
              <span className="word" style={{ animationDelay: "80ms" }}>
                Read
              </span>{" "}
              <span className="word" style={{ animationDelay: "160ms" }}>
                deeply.
              </span>
            </span>
            <span className="text-ribbon block">
              <span className="word" style={{ animationDelay: "320ms" }}>
                Ask
              </span>{" "}
              <span className="word" style={{ animationDelay: "400ms" }}>
                anything.
              </span>
            </span>
          </h1>
        </Frame>
        <p
          className="rise text-muted mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed"
          style={{ animationDelay: "560ms" }}
        >
          Yomu is a calm desktop reader for technical blogs, docs and research
          papers, with the AI agent already on your computer beside every page.
        </p>
        <div
          className="rise relative z-20 mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "680ms" }}
        >
          <DownloadMenu />
          <a
            href={REPO}
            className="bg-card inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow-[0_0_0_1px_var(--color-line)] hover:shadow-[0_0_0_1px_var(--color-muted)]"
          >
            <Github className="size-4" /> View on GitHub
          </a>
        </div>
        {mac ? (
          <div
            className="rise mx-auto mt-6 w-fit max-w-full"
            style={{ animationDelay: "800ms" }}
          >
            <Tag>Run this after install</Tag>
            <Brackets className="mt-3">
              <CopyCommand command="xattr -cr /Applications/Yomu.app" />
            </Brackets>
            <p className="text-muted mx-auto mt-2.5 max-w-[22rem] text-[12px] leading-relaxed text-balance">
              macOS blocks apps that aren't signed by Apple, and Yomu isn't yet.
              Run this in Terminal once to open it.
            </p>
          </div>
        ) : (
          <p className="text-muted mt-4 font-mono text-[11px]">
            macOS · Windows · Linux
          </p>
        )}
      </Rails>
      <Rails className="px-0">
        <div className="pb-3 text-center">
          <Tag>At a glance</Tag>
        </div>
        <Stats
          items={[
            ["Platforms", "Mac · Win · Linux"],
            ["Agents", "Codex · Claude · +2"],
            ["Themes", "22 built in"],
            ["Account", "None needed"],
          ]}
        />
      </Rails>
      <Rails className="relative px-3 pt-14 pb-16 sm:px-8">
        <div
          aria-hidden
          className="glow bg-ribbon/15 absolute inset-x-24 top-16 -z-10 h-64 rounded-full blur-3xl"
        />
        <div className="lift" style={{ animationDelay: "800ms" }}>
          <Shot
            name="hero"
            alt="Yomu with an article open and the agent answering in the chat beside it"
            width={2880}
            height={1800}
            eager
          />
        </div>
      </Rails>
    </section>
  );
}

function Steps() {
  const steps = [
    {
      icon: Link2,
      title: "Bring something to read",
      body: "Paste a link, or open a PDF from your computer. Bookmarks in a Yomu folder arrive on their own.",
    },
    {
      icon: FileText,
      title: "Read it clean",
      body: "Ads, popups and sidebars are gone. Just the text, in the typeface and width you like.",
    },
    {
      icon: MessageSquare,
      title: "Ask as you go",
      body: "Select a line and ask. The agent knows the article, the page you're on and the rest of your library.",
    },
  ];
  return (
    <section className="border-b border-[var(--color-line)]">
      <Rails className="grid sm:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal
            key={s.title}
            delay={i * 90}
            className="border-b border-[var(--color-line)] p-8 last:border-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
          >
            <p className="text-muted font-mono text-[11px]">0{i + 1}</p>
            <s.icon className="mt-6 size-5" strokeWidth={1.5} />
            <h3 className="mt-3 font-serif text-xl font-medium">{s.title}</h3>
            <p className="text-muted mt-2 text-sm leading-relaxed">{s.body}</p>
          </Reveal>
        ))}
      </Rails>
    </section>
  );
}

function Feature({
  n,
  tag,
  title,
  body,
  points,
  shot,
  flip,
}: {
  n: string;
  tag: string;
  title: ReactNode;
  body: string;
  points: string[];
  shot: ReactNode;
  flip?: boolean;
}) {
  return (
    <Reveal className="grid border-b border-[var(--color-line)] last:border-0 md:grid-cols-2">
      <div
        className={`flex flex-col justify-center p-8 sm:p-12 ${flip ? "md:order-2" : ""}`}
      >
        <Label n={n}>{tag}</Label>
        <h3 className="mt-5 font-serif text-[2rem] leading-[1.1] font-medium tracking-tight">
          {title}
        </h3>
        <p className="text-muted mt-4 leading-relaxed">{body}</p>
        <ul className="mt-6 space-y-2 text-sm">
          {points.map((p) => (
            <li key={p} className="flex gap-2.5">
              <span className="bg-ribbon mt-2 size-1 shrink-0 rounded-full" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={`bg-wash flex items-center border-[var(--color-line)] p-6 sm:p-10 ${flip ? "md:border-r" : "md:border-l"}`}
      >
        {shot}
      </div>
    </Reveal>
  );
}

function Features() {
  return (
    <section id="features" className="border-b border-[var(--color-line)]">
      <Rails className="px-5 pt-20 text-center sm:px-8">
        <Reveal>
          <Tag>What it does</Tag>
          <Frame className="-mx-5 mt-5 px-5 py-12 sm:-mx-8 sm:px-8">
            <h2 className="font-serif text-[2.4rem] leading-tight font-medium tracking-tight sm:text-5xl">
              Made for reading that takes effort.
            </h2>
            <p className="text-muted mx-auto mt-4 max-w-lg">
              Long posts, dense docs, forty-page papers. Yomu keeps you in the
              text and gives you help the moment you need it.
            </p>
          </Frame>
        </Reveal>
      </Rails>
      <Rails className="border-t border-[var(--color-line)]">
        <Feature
          n="01"
          tag="Papers"
          title={
            <>
              Research papers,
              <br />a page at a time.
            </>
          }
          body="Open a PDF and Yomu turns two-column layouts, footnotes and references into clean text you can actually read, then lets you turn pages like a book."
          points={[
            "Headings, columns and reference lists come out in order",
            "Picks up where you left off, page by page",
            "The agent knows which page you're on",
          ]}
          shot={
            <Shot
              name="paper"
              alt="A research paper open in Yomu on page 1 of 14, with the page bar at the bottom"
              width={2400}
              height={1560}
            />
          }
        />
        <Feature
          n="02"
          tag="Library chat"
          title={
            <>
              Ask across
              <br />
              everything you've read.
            </>
          }
          body="Start a chat with your whole library. The agent searches the articles and papers you saved, answers from them, and links the sources it used."
          points={[
            "Terms explained once are underlined in every article after",
            "Margin notes on any passage",
            "Search everything you read and asked with ⌘K",
          ]}
          shot={
            <Shot
              name="library-chat"
              alt="A library chat comparing three saved blogs about storage, with links to its sources"
              width={2400}
              height={1560}
            />
          }
          flip
        />
        <Feature
          n="03"
          tag="Library"
          title={
            <>
              Everything you read,
              <br />
              in one place.
            </>
          }
          body="Paste a link and it's saved, cleaned and ready. Bookmark a page into a folder called Yomu in Chrome, Brave or Helium and it lands in your Inbox. No extension to install."
          points={[
            "Works with browser sync, even from your phone",
            "Collections to keep topics together",
            "Tabs for reading several things side by side",
          ]}
          shot={
            <Shot
              name="home"
              alt="Yomu's home page: a link box, the list of saved blogs, and collections in the sidebar"
              width={2400}
              height={1560}
            />
          }
        />
      </Rails>
    </section>
  );
}

const SETTINGS = [
  {
    icon: Palette,
    title: "22 themes",
    body: "Yomu Light, Paper and Yomu Dark, plus Catppuccin, Gruvbox, Nord, Tokyo Night, Dracula, Rosé Pine and more. Or let it follow your system.",
  },
  {
    icon: Type,
    title: "Your typeface",
    body: "Ten reading fonts, from Inter and Atkinson Hyperlegible to Literata, Lora and Newsreader. Set the text size and line width from the Aa menu.",
  },
  {
    icon: SlidersHorizontal,
    title: "Answers that fit you",
    body: "Pick a skill level (Beginner, Balanced or Expert), write your own answer style, like “keep it short” or “reply in Hindi”, and choose a default model.",
  },
  {
    icon: Terminal,
    title: "Choose your agent",
    body: "Switch between Codex, Claude Code, OpenCode or your own ACP command whenever you like.",
  },
  {
    icon: Bookmark,
    title: "Bookmarks inbox",
    body: "Turn the browser bookmark import on or off.",
  },
  {
    icon: Database,
    title: "Your data, your call",
    body: "Block remote images, see where your library is kept, clear saved images, delete chats, or wipe everything.",
  },
];

function Settings() {
  return (
    <section id="settings" className="border-b border-[var(--color-line)]">
      <Rails className="grid lg:grid-cols-[1fr_1.15fr]">
        <Reveal className="border-b border-[var(--color-line)] p-8 sm:p-12 lg:border-r lg:border-b-0">
          <Label n="04">Settings</Label>
          <h2 className="mt-5 font-serif text-[2.4rem] leading-[1.05] font-medium tracking-tight">
            Make it yours.
          </h2>
          <p className="text-muted mt-4 leading-relaxed">
            Everything about how Yomu looks and answers is in one Customize
            page. Try the switch at the top of this page: the screenshots follow
            it, just like the app does.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {SETTINGS.map((it) => (
              <div key={it.title}>
                <it.icon
                  className="text-ribbon size-[18px]"
                  strokeWidth={1.5}
                />
                <h3 className="mt-2.5 text-[15px] font-medium">{it.title}</h3>
                <p className="text-muted mt-1 text-sm leading-relaxed">
                  {it.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120} className="bg-wash flex items-center p-6 sm:p-10">
          <Shot
            name="settings"
            alt="Yomu's Customize page with the theme list open"
            width={2400}
            height={1560}
          />
        </Reveal>
      </Rails>
    </section>
  );
}

const AGENTS = [
  { name: "Codex", by: "OpenAI", note: "Uses your ChatGPT plan" },
  { name: "Claude Code", by: "Anthropic", note: "Uses your Claude plan" },
  { name: "OpenCode", by: "SST", note: "Any model it supports" },
  { name: "Your own", by: "ACP", note: "Any agent that speaks ACP" },
];

function Agents() {
  const promises = [
    {
      icon: KeyRound,
      title: "No API keys",
      body: "Yomu starts the agent you already use. Usage counts against your own plan.",
    },
    {
      icon: ShieldCheck,
      title: "Off until you say so",
      body: "Nothing runs until you pick an agent and agree to what it can see. Asked once, never again.",
    },
    {
      icon: Terminal,
      title: "Fenced in",
      body: "On macOS and Linux the agent runs sandboxed. It reads your library through Yomu's own tools.",
    },
  ];
  return (
    <section
      id="agents"
      className="bg-night text-snow dots border-b border-[var(--color-night-line)]"
    >
      <Rails className="border-[var(--color-night-line)] px-5 py-24 sm:px-12">
        <Label n="05">Agents</Label>
        <Reveal className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <h2 className="font-serif text-[2.4rem] leading-[1.05] font-medium tracking-tight sm:text-[3.4rem]">
            Bring the agent
            <br />
            <em className="text-ribbon font-normal">you already pay for.</em>
          </h2>
          <p className="text-snow/60 leading-relaxed">
            Yomu doesn't ship its own AI or resell tokens. It talks to the
            coding agent on your machine over the Agent Client Protocol, and
            gives it good context: the article, the passage, the page, and a way
            to search everything else you've read.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl bg-[var(--color-night-line)] sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((a, i) => (
            <Reveal key={a.name} delay={i * 80} className="bg-night-2 p-6">
              <p className="text-snow/40 font-mono text-[10px] tracking-widest uppercase">
                {a.by}
              </p>
              <p className="mt-2 text-lg font-medium">{a.name}</p>
              <p className="text-snow/50 mt-1 text-sm">{a.note}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {promises.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <p.icon className="text-ribbon size-5" strokeWidth={1.5} />
              <h3 className="mt-3 font-medium">{p.title}</h3>
              <p className="text-snow/55 mt-1.5 text-sm leading-relaxed">
                {p.body}
              </p>
            </Reveal>
          ))}
        </div>
      </Rails>
    </section>
  );
}

function Local() {
  const items = [
    {
      icon: HardDrive,
      title: "Your library stays on your disk",
      body: "Articles, papers, notes and chats live in a local database. No Yomu account, no Yomu server.",
    },
    {
      icon: Sparkles,
      title: "Free and open source",
      body: "Read the code, build it yourself, or open an issue. Updates are signed and checked on start.",
    },
  ];
  const keys = [
    ["⌘K", "Search everything"],
    ["⌘O", "Open a PDF"],
    ["⌘E", "Show the chat"],
    ["← →", "Turn the page"],
    ["⌘.", "Focus mode"],
    ["⌘T", "New tab"],
  ];
  return (
    <section id="local" className="border-b border-[var(--color-line)]">
      <Rails className="grid md:grid-cols-2">
        <Reveal className="border-b border-[var(--color-line)] p-8 sm:p-12 md:border-r md:border-b-0">
          <Label n="06">Local first</Label>
          <h2 className="mt-5 font-serif text-[2rem] leading-[1.1] font-medium tracking-tight">
            Quiet by design.
          </h2>
          <div className="mt-8 space-y-7">
            {items.map((it) => (
              <div key={it.title} className="flex gap-4">
                <it.icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
                <div>
                  <h3 className="font-medium">{it.title}</h3>
                  <p className="text-muted mt-1 text-sm leading-relaxed">
                    {it.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120} className="p-8 sm:p-12">
          <Label n="07">Keyboard</Label>
          <h2 className="mt-5 font-serif text-[2rem] leading-[1.1] font-medium tracking-tight">
            Hands stay on the keys.
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-2">
            {keys.map(([k, v]) => (
              <div
                key={k}
                className="bg-card flex items-center justify-between rounded-lg px-3 py-2.5 text-sm shadow-[0_0_0_1px_var(--color-line)]"
              >
                <span className="text-muted">{v}</span>
                <kbd className="bg-wash rounded px-1.5 py-0.5 font-mono text-[11px] shadow-[inset_0_-1px_0_var(--color-line)]">
                  {k}
                </kbd>
              </div>
            ))}
          </div>
        </Reveal>
      </Rails>
    </section>
  );
}

function Cta() {
  return (
    <section className="border-b border-[var(--color-line)]">
      <Rails className="px-5 py-28 text-center">
        <Reveal>
          <img src="/icon.png" alt="" className="mx-auto size-20" />
          <Frame className="-mx-5 mt-10 px-5 py-10">
            <h2 className="mx-auto max-w-3xl font-display text-[2.4rem] leading-[1.06] font-normal tracking-[-0.04em] sm:text-6xl">
              Your next long read deserves better than a browser tab.
            </h2>
          </Frame>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <DownloadMenu label="Download Yomu" />
            <a
              href={`${REPO}#readme`}
              className="text-muted hover:text-ink inline-flex items-center gap-1.5 px-3 py-3 text-sm"
            >
              Read the docs <ArrowUpRight className="size-4" />
            </a>
          </div>
        </Reveal>
      </Rails>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <Rails className="text-muted flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-8 text-sm">
        <span className="text-ink flex items-center gap-2 font-medium">
          <img src="/icon.png" alt="" className="size-5" /> Yomu
        </span>
        <span className="font-mono text-[11px]">読む · to read</span>
        <span className="ml-auto flex gap-5">
          <a href={`${REPO}/releases`} className="hover:text-ink">
            Releases
          </a>
          <a href={`${REPO}/issues`} className="hover:text-ink">
            Issues
          </a>
          <a href={REPO} className="hover:text-ink">
            GitHub
          </a>
        </span>
      </Rails>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main className="relative isolate overflow-x-clip">
        <Gutters />
        <Hero />
        <Steps />
        <Features />
        <Settings />
        <Agents />
        <Local />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
