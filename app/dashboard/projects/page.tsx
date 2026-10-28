import Link from "next/link";
import ProjectsManager from "@/components/projects/ProjectsManager";

export const metadata = { title: "Projects & brand voice" };

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <p className="font-mono text-xs">
        <Link href="/dashboard" className="text-text-muted hover:text-accent">
          ← Dashboard
        </Link>
      </p>
      <header className="mt-4 rounded-2xl border border-border/80 bg-surface/50 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">Projects</p>
        <h1 className="mt-2 font-display text-3xl text-text-primary">Brand voice &amp; knowledge base</h1>
        <p className="mt-2 font-serif text-sm text-text-secondary">
          One project per site or client. Pick a project before generating and every article follows its voice and
          sticks to its facts.
        </p>
      </header>
      <ProjectsManager />
    </main>
  );
}
