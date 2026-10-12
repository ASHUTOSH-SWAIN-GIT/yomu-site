import { useEffect, useRef, useState, type FormEvent } from "react";
import { Calligraph } from "calligraph";
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  CornerDownLeft,
  FileText,
  Folder,
  FolderOpen,
  Home,
  Link2,
  Maximize2,
  MessageCircle,
  MessageSquare,
  PanelLeft,
  SlidersHorizontal,
  SquarePen,
  X,
} from "lucide-react";

/**
 * A working miniature of Yomu for the hero: everything is made up and runs
 * in the page (no agent, no network), but it behaves like the app. Open an
 * article from the sidebar or Home, point at an underlined term, ask the
 * chat a question. Drawn at the app's own size and scaled to fit.
 */

interface Article {
  id: string;
  title: string;
  site: string;
  author: string;
  minutes: number;
  pdf?: boolean;
  progress: number;
  /** The paragraphs; `term` is underlined in the first, `note` marked in
   * the second. */
  body: string[];
  term: { word: string; card: string };
  note: { words: string; text: string };
  /** Starter questions and their answers. */
  qa: { q: string; a: string }[];
}

const ARTICLES: Article[] = [
  {
    id: "wal",
    title: "Why Postgres writes everything twice",
    site: "internals.blog",
    author: "Mara Lind",
    minutes: 12,
    progress: 0.42,
    body: [
      "Every change in Postgres is written to the write-ahead log before it touches a table. The WAL is a single, append-only stream, so writing to it is fast and sequential even when the data pages themselves are scattered across the disk.",
      "When the server crashes, nothing is lost: on restart, Postgres replays the log from the last checkpoint and arrives at exactly the state it was in. The table files can lag behind, because the log is the source of truth.",
      "The same stream is what replicas read. A standby is just another server replaying someone else's log, a few milliseconds behind, which is why replication in Postgres is so simple to set up and so hard to get wrong.",
    ],
    term: {
      word: "write-ahead log",
      card: "An append-only record of every change, written before the data files. Postgres replays it after a crash.",
    },
    note: {
      words: "the log is the source of truth",
      text: "So backups could just be the log plus an old snapshot?",
    },
    qa: [
      {
        q: "Explain the WAL simply",
        a: "Think of the **write-ahead log** as a diary Postgres writes in before it does anything. Each change is noted first, in order. If the power goes out, Postgres reads the diary back and redoes whatever had not reached the tables yet, so no committed change is ever lost.",
      },
      {
        q: "Why is it written twice?",
        a: "Once to the **log**, quickly and in order, so the change is safe the moment you commit. Later, a background process writes it to the **table files**, in big batches. The second write can be slow and lazy because the first one already guarantees nothing is lost.",
      },
    ],
  },
  {
    id: "raft",
    title: "Raft, explained in one coffee",
    site: "distsys.notes",
    author: "Theo Park",
    minutes: 8,
    progress: 0.78,
    body: [
      "Raft keeps a group of servers agreeing on one ordered log. One server is the leader; it takes every write, appends it to its log and sends it to the followers.",
      "An entry counts as committed once a majority has it. That is the whole trick: any two majorities overlap, so a new leader always has every committed entry.",
      "When the leader goes quiet, a follower waits a random election timeout, asks for votes, and takes over. The randomness is what keeps two followers from splitting the vote forever.",
    ],
    term: {
      word: "leader",
      card: "The one server that accepts writes and replicates them. Elected by a majority vote.",
    },
    note: {
      words: "any two majorities overlap",
      text: "This is the key idea. Same reason quorums work in Dynamo.",
    },
    qa: [
      {
        q: "Why does a majority matter?",
        a: "Because **any two majorities share at least one server**. If an entry reached a majority, then whichever servers elect the next leader include someone who has it, and Raft only lets a server win if its log is at least that up to date.",
      },
      {
        q: "What if two leaders exist?",
        a: "Only one can be **current**. Every leader has a term number, and a server ignores anything from an older term. An old leader that was cut off can still believe it leads, but it can't commit anything: it never reaches a majority.",
      },
    ],
  },
  {
    id: "spanner",
    title: "Spanner: Google's Globally Distributed Database",
    site: "PDF",
    author: "Corbett et al.",
    minutes: 45,
    pdf: true,
    progress: 0.15,
    body: [
      "Spanner is a database that shards data across many sets of Paxos state machines in datacenters spread all over the world, and it supports externally consistent distributed transactions.",
      "The key enabler is TrueTime, an API that exposes clock uncertainty. Instead of pretending clocks agree, Spanner waits out the uncertainty before it makes a commit visible.",
      "That wait, commit wait, is usually under ten milliseconds, and it is what lets every transaction be ordered as if a single machine had run them all.",
    ],
    term: {
      word: "TrueTime",
      card: "Google's clock API: it returns an interval, not a time, and guarantees the real time lies inside it.",
    },
    note: {
      words: "waits out the uncertainty",
      text: "Commit wait. Clever: trade a few ms of latency for ordering.",
    },
    qa: [
      {
        q: "What is TrueTime?",
        a: "**TrueTime** gives you a time *interval* instead of a single timestamp, and promises the real time is somewhere inside it. GPS and atomic clocks keep that interval small, usually a few milliseconds.",
      },
      {
        q: "Summarize the paper",
        a: "Spanner is a **globally distributed SQL database**. It keeps replicas in sync with Paxos and orders transactions across the world using **TrueTime**, waiting out clock uncertainty so that commits appear in real-time order.",
      },
    ],
  },
];

const COLLECTIONS = [
  { name: "Databases", ids: ["wal", "spanner"] },
  { name: "Distributed systems", ids: ["raft"] },
];

type View = { kind: "home" } | { kind: "article"; id: string };
interface Message {
  role: "user" | "agent";
  text: string;
}

const W = 1200;
const H = 740;

export function MockApp() {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [view, setView] = useState<View>({ kind: "article", id: "wal" });
  const [sidebar, setSidebar] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [chats, setChats] = useState<Record<string, Message[]>>({});
  const [working, setWorking] = useState(false);
  const article =
    view.kind === "article" ? ARTICLES.find((a) => a.id === view.id)! : null;

  // The agent "answers": a pause, then the words arrive a few at a time.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function ask(a: Article, q: string) {
    if (working || !q.trim()) return;
    const known = a.qa.find((x) => x.q === q);
    const answer =
      known?.a ??
      `Good question. The article's short answer: ${a.body[0].split(". ")[0].toLowerCase()}. In the real app your own agent (Codex, Claude Code or OpenCode) answers this, with the whole article in front of it.`;
    const words = answer.split(" ");
    setChats((c) => ({
      ...c,
      [a.id]: [...(c[a.id] ?? []), { role: "user", text: q }],
    }));
    setWorking(true);
    let shown = 0;
    const tick = () => {
      shown = Math.min(words.length, shown + 3);
      setChats((c) => {
        const list = [...(c[a.id] ?? [])];
        const last = list[list.length - 1];
        const text = words.slice(0, shown).join(" ");
        if (last?.role === "agent") list[list.length - 1] = { ...last, text };
        else list.push({ role: "agent", text });
        return { ...c, [a.id]: list };
      });
      if (shown < words.length) timers.current.push(window.setTimeout(tick, 45));
      else setWorking(false);
    };
    timers.current.push(window.setTimeout(tick, 650));
  }

  const open = (id: string) => setView({ kind: "article", id });

  return (
    <div
      ref={frame}
      className="bg-frame w-full overflow-hidden rounded-xl text-left shadow-[0_0_0_1px_var(--color-line),0_30px_70px_-30px_rgb(0_0_0/0.45)]"
      style={{ height: H * scale }}
    >
      <div
        className="text-ink flex origin-top-left font-sans text-[13px]"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
      >
        <Sidebar
          open={sidebar}
          view={view}
          onHome={() => setView({ kind: "home" })}
          onOpen={open}
        />
        <div className="bg-paper flex min-w-0 flex-1 flex-col">
          <TopBar
            sidebar={sidebar}
            onSidebar={() => setSidebar(!sidebar)}
            article={article}
            onHome={() => setView({ kind: "home" })}
            chatOpen={chatOpen}
            onChat={() => setChatOpen(!chatOpen)}
          />
          <div className="flex min-h-0 flex-1">
            <div className="min-w-0 flex-1 overflow-y-auto">
              {article ? (
                <Reader key={article.id} article={article} />
              ) : (
                <HomeView onOpen={open} />
              )}
            </div>
            {article && chatOpen && (
              <Chat
                article={article}
                messages={chats[article.id] ?? []}
                working={working}
                onAsk={(q) => ask(article, q)}
                onClose={() => setChatOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  open,
  view,
  onHome,
  onOpen,
}: {
  open: boolean;
  view: View;
  onHome: () => void;
  onOpen: (id: string) => void;
}) {
  const reading = view.kind === "article" ? view.id : null;
  return (
    <nav
      aria-label="Preview sidebar"
      className="border-line flex shrink-0 flex-col gap-0.5 overflow-hidden border-r px-2 pb-3 transition-[width,padding,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        width: open ? 208 : 0,
        paddingInline: open ? 8 : 0,
        opacity: open ? 1 : 0,
      }}
    >
      <div className="flex h-9 shrink-0 items-center gap-1.5 px-1.5">
        <i className="size-3 rounded-full bg-[#ff5f57]" />
        <i className="size-3 rounded-full bg-[#febc2e]" />
        <i className="size-3 rounded-full bg-[#28c840]" />
      </div>
      <Item icon={Home} on={view.kind === "home"} onClick={onHome}>
        Home
      </Item>
      <Item icon={FileText} count={1} onClick={() => onOpen("spanner")}>
        Papers
      </Item>
      <Label>Chats</Label>
      <Item icon={SquarePen}>New chat</Item>
      <Item icon={MessageCircle} muted>
        How do my storage blogs…
      </Item>
      <Label>Collections</Label>
      {COLLECTIONS.map((c) => (
        <div key={c.name}>
          <Item icon={FolderOpen} count={c.ids.length}>
            {c.name}
          </Item>
          {c.ids.map((id) => {
            const a = ARTICLES.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onOpen(id)}
                className={`flex h-7 w-full items-center gap-2 rounded-md pr-2 pl-7 text-left text-[12px] ${
                  reading === id
                    ? "bg-wash text-ink font-medium"
                    : "text-muted hover:bg-wash/70 hover:text-ink"
                }`}
              >
                <SiteMark article={a} small />
                <span className="truncate">{a.title}</span>
              </button>
            );
          })}
        </div>
      ))}
      <Item icon={Folder} count={0}>
        Reading list
      </Item>
      <div className="mt-auto">
        <Item icon={SlidersHorizontal}>Settings</Item>
      </div>
    </nav>
  );
}

function Label({ children }: { children: string }) {
  return (
    <p className="text-muted mt-4 mb-1 px-2.5 text-[11px] font-medium">
      {children}
    </p>
  );
}

function Item({
  icon: Icon,
  on,
  count,
  muted,
  onClick,
  children,
}: {
  icon: typeof Home;
  on?: boolean;
  count?: number;
  muted?: boolean;
  onClick?: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[30px] w-full shrink-0 items-center gap-2.5 rounded-md px-2.5 text-left ${
        on ? "bg-wash font-medium" : "hover:bg-wash/70"
      } ${muted ? "text-muted" : ""}`}
    >
      <Icon className="text-muted size-4 shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count !== undefined && count > 0 && (
        <span className="text-muted text-[11px] tabular-nums">{count}</span>
      )}
    </button>
  );
}

function SiteMark({ article, small }: { article: Article; small?: boolean }) {
  if (article.pdf) {
    return (
      <FileText
        className={`text-muted shrink-0 ${small ? "size-4" : "size-5"}`}
        strokeWidth={1.75}
      />
    );
  }
  return (
    <span
      className={`bg-ink text-paper grid shrink-0 place-items-center rounded font-semibold ${
        small ? "size-4 text-[9px]" : "size-7 text-[12px]"
      }`}
    >
      {article.site[0].toUpperCase()}
    </span>
  );
}

function TopBar({
  sidebar,
  onSidebar,
  article,
  onHome,
  chatOpen,
  onChat,
}: {
  sidebar: boolean;
  onSidebar: () => void;
  article: Article | null;
  onHome: () => void;
  chatOpen: boolean;
  onChat: () => void;
}) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-2 px-2">
      <div className="flex items-center gap-1">
        {!sidebar && (
          <span className="flex gap-1.5 px-1.5">
            <i className="size-3 rounded-full bg-[#ff5f57]" />
            <i className="size-3 rounded-full bg-[#febc2e]" />
            <i className="size-3 rounded-full bg-[#28c840]" />
          </span>
        )}
        <IconButton label="Toggle the sidebar" onClick={onSidebar}>
          <PanelLeft />
        </IconButton>
        {article ? (
          <button
            type="button"
            onClick={onHome}
            className="text-muted hover:text-ink hover:bg-wash flex h-8 items-center gap-1 rounded-md px-1.5"
          >
            <ChevronLeft className="size-3.5" /> Home
          </button>
        ) : (
          <span className="px-1.5 font-medium">Home</span>
        )}
      </div>
      {/* What you are reading: the title morphs as you move between pages. */}
      <p className="text-muted min-w-0 flex-1 truncate text-center">
        <Calligraph animation="smooth">{article?.title ?? "Your library"}</Calligraph>
      </p>
      {article && (
        <button
          type="button"
          onClick={onChat}
          className={`flex h-8 items-center gap-2 rounded-md px-2.5 ${
            chatOpen ? "bg-wash" : "text-muted hover:bg-wash/70"
          }`}
        >
          <MessageSquare className="size-4" strokeWidth={1.75} /> Chat
        </button>
      )}
    </header>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="text-muted hover:text-ink hover:bg-wash grid size-8 place-items-center rounded-md [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

function HomeView({ onOpen }: { onOpen: (id: string) => void }) {
  const [link, setLink] = useState("");
  const [fetching, setFetching] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!link.trim() || fetching) return;
    // Any link "opens" the first article after a short fetch.
    setFetching(true);
    window.setTimeout(() => onOpen("wal"), 1100);
  }
  return (
    <div className="mx-auto max-w-[44rem] px-10 pt-12 pb-16">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.025em]">
        Good evening
      </h1>
      <form
        onSubmit={submit}
        className="bg-wash mt-6 flex h-12 items-center gap-3 rounded-2xl pr-1.5 pl-4"
      >
        <Link2 className="text-muted size-4 shrink-0" />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste a link to read it here"
          aria-label="Link (preview)"
          className="placeholder:text-muted min-w-0 flex-1 bg-transparent text-[14px] outline-none"
        />
        <button
          type="submit"
          className="bg-ink text-paper flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium"
        >
          Open <CornerDownLeft className="size-3.5 opacity-60" />
        </button>
      </form>
      {fetching && (
        <div className="mt-4">
          <div className="bg-line relative h-[3px] overflow-hidden rounded-full">
            <div className="bg-ink absolute inset-y-0 left-0 w-1/3 animate-[slide_1.1s_ease-in-out_infinite] rounded-full" />
          </div>
          <p className="text-muted mt-2">Fetching {link.replace(/^https?:\/\//, "").split("/")[0] || "the page"}…</p>
        </div>
      )}
      <h2 className="mt-10 text-[15px] font-semibold">Continue reading</h2>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {ARTICLES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onOpen(a.id)}
            className="bg-card border-line hover:border-muted/50 flex flex-col rounded-xl border p-4 text-left transition-colors"
          >
            <SiteMark article={a} />
            <span className="mt-3 line-clamp-2 text-[14px] leading-snug font-medium">
              {a.title}
            </span>
            <span className="text-muted mt-1 text-[12px]">{a.author}</span>
            <span className="mt-4 flex items-center gap-2">
              <span className="bg-line h-1 flex-1 overflow-hidden rounded-full">
                <span
                  className="bg-ink/70 block h-full rounded-full"
                  style={{ width: `${a.progress * 100}%` }}
                />
              </span>
              <span className="text-muted text-[11px] tabular-nums">
                {Math.round(a.progress * 100)}%
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Splits `text` around `part` (first match), for the underlined term and
 * the commented words. */
function around(text: string, part: string) {
  const i = text.indexOf(part);
  return i < 0
    ? null
    : [text.slice(0, i), text.slice(i, i + part.length), text.slice(i + part.length)];
}

function Reader({ article }: { article: Article }) {
  const [card, setCard] = useState(false);
  const term = around(article.body[0], article.term.word);
  const noted = around(article.body[1], article.note.words);
  return (
    <article className="mx-auto max-w-[34rem] px-8 pt-12 pb-16 text-[16px] leading-[1.72]">
      <p className="text-muted mb-3 flex items-center gap-2 text-[12px] font-medium">
        <i className="bg-muted size-2 rounded-full" />
        {article.site}
      </p>
      <h1 className="font-display text-[1.9rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
        {article.title}
      </h1>
      <p className="text-muted mt-3 flex gap-5 text-[13px]">
        <span className="text-ink font-medium">{article.author}</span>
        <span>{article.minutes} min read</span>
        {article.pdf && <span>14 pages</span>}
      </p>
      <div className="mt-6 flex items-center gap-2">
        <i className="bg-ink h-[3px] w-8 rounded-full" />
        <i className="bg-line h-px flex-1" />
      </div>
      <div className="relative mt-7 space-y-4">
        <p>
          {term ? (
            <>
              {term[0]}
              <span
                className="relative cursor-help underline decoration-muted decoration-dotted decoration-[1.5px] underline-offset-[0.22em]"
                onMouseEnter={() => setCard(true)}
                onMouseLeave={() => setCard(false)}
              >
                {term[1]}
                {card && (
                  <span className="bg-card absolute bottom-full left-1/2 z-10 mb-2 w-72 -translate-x-1/2 rounded-xl p-3.5 text-[13px] leading-relaxed shadow-[0_0_0_1px_var(--color-line),0_18px_40px_-12px_rgb(0_0_0/0.3)]">
                    <span className="block font-semibold">{article.term.word}</span>
                    <span className="text-muted mt-1 block">{article.term.card}</span>
                    <span className="text-muted mt-2 block text-[11px]">
                      Explained earlier by your agent
                    </span>
                  </span>
                )}
              </span>
              {term[2]}
            </>
          ) : (
            article.body[0]
          )}
        </p>
        <div className="relative">
          <p>
            {noted ? (
              <>
                {noted[0]}
                <mark className="text-ink rounded-sm bg-[rgb(250_204_21/0.4)] decoration-[#d9a400] underline decoration-2 underline-offset-[0.22em] dark:bg-[rgb(250_204_21/0.26)]">
                  {noted[1]}
                </mark>
                {noted[2]}
              </>
            ) : (
              article.body[1]
            )}
          </p>
          {/* Your note on the marked words (beside them in a wide window). */}
          <aside className="bg-card mt-3 ml-auto w-64 rounded-xl p-3 text-[12px] leading-snug shadow-[0_0_0_1px_var(--color-line)]">
            <span className="font-medium">You</span>
            <span className="text-muted mt-1 block">{article.note.text}</span>
          </aside>
        </div>
        <p>{article.body[2]}</p>
      </div>
    </article>
  );
}

/** **bold** in canned answers, nothing else. */
function Bolded({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith("*") ? (
          <em key={i}>{part.slice(1, -1)}</em>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Chat({
  article,
  messages,
  working,
  onAsk,
  onClose,
}: {
  article: Article;
  messages: Message[];
  working: boolean;
  onAsk: (q: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  // Keep the newest words in view, scrolling the chat only (never the
  // page around the preview).
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);
  const waiting = working && messages[messages.length - 1]?.role === "user";
  return (
    <aside className="bg-paper border-line flex w-[340px] shrink-0 flex-col border-l">
      <header className="flex h-12 shrink-0 items-center gap-1 pr-2 pl-5">
        <div className="flex min-w-0 flex-1 items-baseline gap-3">
          <h2 className="text-[15px] font-semibold">Chat</h2>
          <span className="text-muted flex items-center gap-1.5 text-[11px]">
            <i
              className={`bg-muted size-1.5 rounded-full ${working ? "animate-pulse" : ""}`}
            />
            Claude Code ·{" "}
            <Calligraph animation="snappy">{working ? "Working…" : "Ready"}</Calligraph>
          </span>
        </div>
        <IconButton label="Full screen (preview)">
          <Maximize2 />
        </IconButton>
        <IconButton label="Close the chat" onClick={onClose}>
          <X />
        </IconButton>
      </header>
      <div ref={list} className="min-h-0 flex-1 overflow-y-auto px-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 pb-10 text-center">
            <p className="text-[18px] font-semibold tracking-[-0.015em]">
              Ask about this article
            </p>
            <p className="text-muted text-[13px]">
              The agent has the whole text, so ask it anything.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {article.qa.map((x) => (
                <button
                  key={x.q}
                  type="button"
                  onClick={() => onAsk(x.q)}
                  className="bg-wash text-muted hover:text-ink h-8 rounded-full px-3.5 text-[12px]"
                >
                  {x.q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-5 py-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <li key={i} className="flex justify-end">
                  <p className="bg-wash max-w-[85%] rounded-3xl px-4 py-2.5 text-[13px]">
                    {m.text}
                  </p>
                </li>
              ) : (
                <li key={i} className="text-[13px] leading-6">
                  <Bolded text={m.text} />
                </li>
              ),
            )}
            {waiting && (
              <li className="flex gap-1 py-2">
                {[0, 150, 300].map((d) => (
                  <i
                    key={d}
                    className="bg-muted size-1.5 animate-bounce rounded-full"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </li>
            )}
            {!working && (
              <li className="flex flex-wrap gap-2">
                {article.qa
                  .filter((x) => !messages.some((m) => m.text === x.q))
                  .map((x) => (
                    <button
                      key={x.q}
                      type="button"
                      onClick={() => onAsk(x.q)}
                      className="bg-wash text-muted hover:text-ink h-7 rounded-full px-3 text-[12px]"
                    >
                      {x.q}
                    </button>
                  ))}
              </li>
            )}
          </ul>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAsk(text);
          setText("");
        }}
        className="px-4 pt-1 pb-4"
      >
        <div className="bg-wash flex flex-col rounded-3xl px-4 pt-3 pb-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask about this article"
            aria-label="Ask (preview)"
            className="placeholder:text-muted bg-transparent text-[14px] outline-none"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="text-muted flex items-center gap-1 text-[12px]">
              Auto <ChevronDown className="size-3" />
            </span>
            <button
              type="submit"
              aria-label="Send (preview)"
              disabled={!text.trim() || working}
              className="bg-ink text-paper disabled:bg-line disabled:text-muted grid size-8 place-items-center rounded-full"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}
