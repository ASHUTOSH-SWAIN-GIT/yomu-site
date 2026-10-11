import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades its content up the first time it scrolls into view. `delay` (ms)
 * staggers siblings. Where IntersectionObserver is missing the content is
 * simply shown. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  return (
    <div
      ref={ref}
      data-seen={seen}
      style={{ transitionDelay: seen ? `${delay}ms` : undefined }}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}
