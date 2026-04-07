import type { InterestComparison } from "@/lib/education-trends";

const SERIES_COLORS = [
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#ab47bc",
  "#00acc1",
  "#ff7043",
];

type Props = {
  interest: InterestComparison | null;
};

export function InterestOverTimeChart({ interest }: Props) {
  if (!interest || interest.timeline.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-12 text-center font-serif text-sm text-text-secondary">
        Interest over time is not available for this refresh (Google may have returned an error, or
        there are too few data points). Try again later or switch region.
      </div>
    );
  }

  const { timeline, keywords, note } = interest;
  const W = 736;
  const H = 280;
  const padL = 44;
  const padR = 12;
  const padT = 24;
  const padB = 52;
  const cw = W - padL - padR;
  const ch = H - padT - padB;
  const n = timeline.length;

  const gridYs = [0, 25, 50, 75, 100];
  const lines = keywords.map((label, ki) => {
    const pts = timeline.map((pt, j) => {
      const x = padL + (n <= 1 ? cw / 2 : (j / (n - 1)) * cw);
      const v = Math.min(100, Math.max(0, pt.values[ki] ?? 0));
      const y = padT + ch - (v / 100) * ch;
      return { x, y };
    });
    const d = pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    return { label, d, color: SERIES_COLORS[ki % SERIES_COLORS.length] };
  });

  const xLabelIdx = [0, Math.floor((n - 1) / 2), n - 1].filter((i, j, a) => a.indexOf(i) === j);

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-h-[300px] text-text-muted"
        role="img"
        aria-label="Interest over time comparison"
      >
        <title>Interest over time for benchmark keywords</title>
        {gridYs.map((gv) => {
          const y = padT + ch - (gv / 100) * ch;
          return (
            <g key={gv}>
              <line
                x1={padL}
                x2={padL + cw}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.18}
                strokeWidth={1}
              />
              <text x={6} y={y + 4} className="fill-current text-[10px]">
                {gv}
              </text>
            </g>
          );
        })}
        <line
          x1={padL}
          x2={padL}
          y1={padT}
          y2={padT + ch}
          stroke="currentColor"
          strokeOpacity={0.22}
          strokeWidth={1}
        />
        <line
          x1={padL + cw}
          x2={padL + cw}
          y1={padT}
          y2={padT + ch}
          stroke="currentColor"
          strokeOpacity={0.22}
          strokeWidth={1}
        />
        {lines.map(({ d, color, label }) => (
          <path
            key={label}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {xLabelIdx.map((j) => {
          const x = padL + (n <= 1 ? cw / 2 : (j / (n - 1)) * cw);
          return (
            <text
              key={`x-${j}`}
              x={x}
              y={H - 18}
              textAnchor="middle"
              className="fill-current text-[10px]"
            >
              {timeline[j]?.label ?? ""}
            </text>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3">
        {lines.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-medium text-text-primary">{label}</span>
          </div>
        ))}
      </div>
      <p className="font-serif text-[11px] leading-relaxed text-text-muted">{note}</p>
    </div>
  );
}
