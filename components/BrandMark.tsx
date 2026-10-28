/** RankFlowHQ mark: ascending bars with a flow arrow. Inline SVG so it stays crisp at every size and theme. */
export function BrandMark({ className = "h-10 w-10", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <rect width="64" height="64" rx="15" fill="#0b1220" />
      <rect x="12" y="38" width="9" height="14" rx="2.5" fill="#1d7fb8" />
      <rect x="25" y="30" width="9" height="22" rx="2.5" fill="#2aa3e0" />
      <rect x="38" y="20" width="9" height="32" rx="2.5" fill="#38bdf8" />
      <path fill="#fff" d="M9 44.5 C19 44.5 27.5 39.5 36 30.5 L41.5 24.5 L45.2 28 L39.6 34 C30.5 43.5 21 48.2 9 48.2 Z" />
      <path fill="#fff" d="M42.5 15.5 L56 12 L52.5 25.5 Z" />
    </svg>
  );
}
