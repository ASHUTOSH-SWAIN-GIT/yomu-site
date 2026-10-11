import { useId } from "react";

/* Isometric line art for the background: a triangular grid, and stacks of
 * pages drawn on it. Thin lines in the text colour at low strength, so they
 * follow light and dark themes; the ribbon is the icon's orange. */

const S = 28; // grid spacing
const W = S * Math.sqrt(3); // tile width for lines at 30 degrees

/** An isometric grid that fades out from the middle. */
export function IsoGrid({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden
      className={`text-ink pointer-events-none ${className}`}
      style={{
        maskImage:
          "radial-gradient(ellipse 60% 55% at 50% 45%, black 10%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 60% 55% at 50% 45%, black 10%, transparent 75%)",
      }}
    >
      <defs>
        <pattern id={id} width={W} height={S} patternUnits="userSpaceOnUse">
          <path
            d={`M0 0L${W} ${S}M0 ${S}L${W} 0M0 0V${S}M${W / 2} 0V${S}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            opacity="0.15"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** One sheet as a rhombus seen from above, `x`,`y` its centre. */
function sheet(x: number, y: number, w: number) {
  const h = w * Math.tan(Math.PI / 6);
  return `M${x} ${y - h}L${x + w} ${y}L${x} ${y + h}L${x - w} ${y}Z`;
}

/** A small stack of pages in isometric view, the top one with lines of text
 * and a ribbon bookmark hanging over its front edge. */
export function PageStack({
  className = "",
  sheets = 4,
}: {
  className?: string;
  sheets?: number;
}) {
  const w = 64;
  const h = w * Math.tan(Math.PI / 6);
  const gap = 9;
  const cx = 80;
  const top = 40;
  const layers = Array.from({ length: sheets }, (_, i) => sheets - 1 - i);
  // Points on the top sheet: from its left corner, `u` along the back-left
  // edge and `v` along the front-left one, both 0 to 1, stay on the sheet.
  const at = (u: number, v: number) =>
    [cx - w + u * w + v * w, top - u * h + v * h] as const;
  const lines = [0.22, 0.38, 0.54, 0.7].map((u, i) => {
    const [x1, y1] = at(u, 0.14);
    const [x2, y2] = at(u, i === 3 ? 0.5 : 0.82);
    return `M${x1} ${y1}L${x2} ${y2}`;
  });
  // The ribbon hangs over the front-right edge.
  const [rx, ry] = at(0.3, 1);
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 150"
      className={`text-ink pointer-events-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
    >
      {layers.map((i) => {
        const y = top + i * gap;
        return (
          <g key={i} strokeOpacity={i === 0 ? 0.55 : 0.28}>
            {/* Filled with the page colour, so a sheet hides the ones below. */}
            <path
              d={`M${cx - w} ${y}v3L${cx} ${y + h + 3}L${cx + w} ${y + 3}v-3`}
              fill="var(--color-paper)"
              strokeWidth="0.7"
            />
            <path
              d={sheet(cx, y, w)}
              fill="var(--color-paper)"
              strokeWidth="0.9"
            />
          </g>
        );
      })}
      <g opacity="0.4" strokeWidth="0.8" strokeLinecap="round">
        {lines.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path
        d={`M${rx - 3.5} ${ry - 2}l7 -4v24l-3.5 -2.5l-3.5 4.5z`}
        className="text-ribbon"
        fill="currentColor"
        stroke="none"
        opacity="0.9"
      />
    </svg>
  );
}
