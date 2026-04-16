export default function GlobalLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-28 md:px-6 md:py-12 md:pb-12">
      <section className="rounded-3xl border border-border/70 bg-surface/50 p-5 md:p-8">
        <div className="skeleton h-4 w-36 rounded-md" />
        <div className="skeleton mt-4 h-10 w-11/12 rounded-lg md:h-14 md:w-3/4" />
        <div className="skeleton mt-4 h-5 w-10/12 rounded-md md:w-2/3" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="skeleton h-11 rounded-xl" />
          <div className="skeleton h-11 rounded-xl" />
        </div>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="rounded-2xl border border-border/70 bg-surface/40 p-5">
            <div className="skeleton h-5 w-1/2 rounded-md" />
            <div className="skeleton mt-3 h-4 w-full rounded-md" />
            <div className="skeleton mt-2 h-4 w-5/6 rounded-md" />
          </div>
        ))}
      </section>
    </main>
  );
}
