import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceLab } from "@/components/lab/place-lab";
import { RackLab } from "@/components/lab/rack-lab";
import { WalkLab } from "@/components/lab/walk-lab";
import { getLab, getReadyLabs } from "@/lib/labs";

export const dynamicParams = false;

export function generateStaticParams() {
  return getReadyLabs().map((lab) => ({ lab: lab.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lab: string }>;
}): Promise<Metadata> {
  const lab = getLab((await params).lab);
  if (!lab) return {};
  return { title: lab.title, description: lab.subtitle };
}

export default async function LabPage({ params }: { params: Promise<{ lab: string }> }) {
  const lab = getLab((await params).lab);
  if (!lab || lab.status !== "ready") notFound();

  return (
    <div data-accent={lab.accent} className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <nav className="flex items-center gap-2 text-xs text-fg-subtle" aria-label="パンくず">
          <Link href="/labs/" className="hover:text-fg">
            ラボ
          </Link>
          <span aria-hidden>/</span>
          <span className="text-fg-muted">{lab.title}</span>
        </nav>

        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lab.title}</h1>
          <p className="mt-2 text-sm text-fg-muted">{lab.subtitle}</p>
        </div>

        <section className="rounded-xl border border-border bg-surface-2 px-5 py-4">
          <p className="mb-1 text-xs font-bold text-fg-subtle">このラボのねらい</p>
          <p className="text-sm leading-relaxed text-fg-muted">{lab.goal}</p>
        </section>
      </header>

      {lab.mode === "build" ? (
        <RackLab lab={lab} />
      ) : lab.mode === "place" ? (
        <PlaceLab lab={lab} />
      ) : (
        <WalkLab lab={lab} />
      )}
    </div>
  );
}
