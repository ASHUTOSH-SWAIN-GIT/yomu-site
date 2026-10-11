import type { ReactNode } from "react";

/* The page's drafting grid: hatched gutters beside the rails, full-width
 * rules that meet the rails at small crosses, and corner brackets. All of it
 * is decoration, hidden from screen readers. */

const HATCH =
  "repeating-linear-gradient(135deg, var(--color-line) 0 1px, transparent 1px 7px)";

/** A hatched band just outside each rail, down the whole page. Sections
 * with their own background (the dark one) paint over it. */
export function Gutters() {
  const band =
    "absolute inset-y-0 hidden w-10 border-[var(--color-line)] xl:block";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className={`${band} right-[calc(50%+36rem)] border-l`}
        style={{ backgroundImage: HATCH }}
      />
      <div
        className={`${band} left-[calc(50%+36rem)] border-r`}
        style={{ backgroundImage: HATCH }}
      />
    </div>
  );
}

function Cross({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 11 11"
      className={`text-muted absolute z-10 size-[11px] ${className}`}
    >
      <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** Rules across the whole width above and below the content, with a cross
 * where each meets a rail. The element must span the rails exactly (undo
 * the section's side padding with negative margins). */
export function Frame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const rule =
    "pointer-events-none absolute left-1/2 h-px w-[200vw] -translate-x-1/2 bg-[var(--color-line)]";
  return (
    <div className={`relative ${className}`}>
      <i aria-hidden className={`${rule} top-0`} />
      <i aria-hidden className={`${rule} bottom-0`} />
      <Cross className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
      <Cross className="top-0 right-0 translate-x-1/2 -translate-y-1/2" />
      <Cross className="bottom-0 left-0 -translate-x-1/2 translate-y-1/2" />
      <Cross className="right-0 bottom-0 translate-x-1/2 translate-y-1/2" />
      {children}
    </div>
  );
}

/** Small L-shaped marks just outside each corner. */
export function Brackets({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const mark = "pointer-events-none absolute size-2 border-muted/70";
  return (
    <div className={`relative ${className}`}>
      <i
        aria-hidden
        className={`${mark} -top-1.5 -left-1.5 border-t border-l`}
      />
      <i
        aria-hidden
        className={`${mark} -top-1.5 -right-1.5 border-t border-r`}
      />
      <i
        aria-hidden
        className={`${mark} -bottom-1.5 -left-1.5 border-b border-l`}
      />
      <i
        aria-hidden
        className={`${mark} -right-1.5 -bottom-1.5 border-r border-b`}
      />
      {children}
    </div>
  );
}

/** A mono label in square brackets: [ LIKE THIS ]. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted font-mono text-[10.5px] tracking-[0.18em] uppercase">
      [ {children} ]
    </p>
  );
}

/** A row of cells between two full-width rules. */
export function Stats({ items }: { items: [string, string][] }) {
  return (
    <div className="relative">
      <i
        aria-hidden
        className="absolute top-0 left-1/2 h-px w-[200vw] -translate-x-1/2 bg-[var(--color-line)]"
      />
      <i
        aria-hidden
        className="absolute bottom-0 left-1/2 h-px w-[200vw] -translate-x-1/2 bg-[var(--color-line)]"
      />
      <dl className="mx-auto grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4">
        {items.map(([label, value], i) => (
          <div
            key={label}
            className={`border-[var(--color-line)] px-4 py-3.5 text-center ${
              i % 2 === 0 ? "border-l" : "border-x"
            } sm:border-l ${i === items.length - 1 ? "sm:border-r" : "sm:border-r-0"} ${
              i < 2 ? "border-b sm:border-b-0" : ""
            }`}
          >
            <dt className="text-muted font-mono text-[10px] tracking-[0.16em] uppercase">
              ${label}
            </dt>
            <dd className="text-ribbon mt-1 font-mono text-[12px] tracking-wide uppercase">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
