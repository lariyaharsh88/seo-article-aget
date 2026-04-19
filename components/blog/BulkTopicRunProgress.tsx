"use client";

/** Visual progress when generating multiple topics (sequential API runs). */
export function BulkTopicRunProgress({
  current,
  total,
  active,
}: {
  current: number;
  total: number;
  active: boolean;
}) {
  if (!active || total < 2) return null;
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between font-mono text-[11px] text-text-muted">
        <span>Article progress</span>
        <span>
          {current}/{total} ({pct}%)
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-background/60"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
