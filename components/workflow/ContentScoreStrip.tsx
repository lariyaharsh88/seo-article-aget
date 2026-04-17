"use client";

type Props = {
  overall: number;
  onViewDetails: () => void;
  onOpenSeoPack: () => void;
  visible: boolean;
};

/**
 * Thin strip above tab content — surfaces score without opening the Score tab first.
 */
export function ContentScoreStrip({
  overall,
  onViewDetails,
  onOpenSeoPack,
  visible,
}: Props) {
  if (!visible) return null;

  const tone =
    overall >= 80 ? "text-success" : overall >= 55 ? "text-accent" : "text-amber-400";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-background/50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-text-muted">Content score</span>
        <span className={`font-display text-xl ${tone}`}>{overall}</span>
        <span className="font-mono text-[10px] text-text-muted">/ 100</span>
        <button
          type="button"
          onClick={onViewDetails}
          className="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-accent hover:border-accent"
        >
          View breakdown
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenSeoPack}
        className="rounded-md bg-accent/15 px-2 py-1 font-mono text-[10px] font-semibold text-accent hover:bg-accent/25"
      >
        SEO package →
      </button>
    </div>
  );
}
