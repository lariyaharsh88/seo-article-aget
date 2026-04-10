export function EducationNewsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border bg-surface/80 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div className="h-6 w-3/4 rounded bg-border" />
              <div className="h-4 w-1/4 rounded bg-border" />
            </div>
            <div className="h-6 w-24 rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}
