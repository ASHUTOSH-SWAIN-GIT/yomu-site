import type { ReactNode } from "react";

/* Small drafting touches: corner brackets, bracketed labels, a row of
 * stat cells. Decoration is hidden from screen readers. */

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
