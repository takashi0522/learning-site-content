import type { Metadata } from "next";
import Link from "next/link";
import { getLabs } from "@/lib/labs";

export const metadata: Metadata = {
  title: "ラボ",
  description: "読むのではなく、自分で判断して確かめるための演習。",
};

export default function LabsPage() {
  const labs = getLabs();

  return (
    <div className="flex flex-col gap-10">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ラボ</h1>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          コースが「なぜそうなるか」を読むところなら、ラボは
          <strong className="text-fg">自分の判断を先に出して、実際の仕組みと突き合わせる</strong>
          ところです。間違えた選択肢こそが、いま曖昧な部分を教えてくれます。
        </p>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          採点はしません。記録するのは「どこで迷ったか」だけで、それもこのブラウザに閉じています。
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {labs.map((lab) => {
          const ready = lab.status === "ready";
          const card = (
            <article
              data-accent={lab.accent}
              className={[
                "relative isolate flex h-full flex-col gap-3 rounded-2xl border px-6 py-5 transition",
                ready
                  ? "border-border bg-surface hover:border-accent"
                  : "border-dashed border-border bg-surface-2",
              ].join(" ")}
            >
              {/* 装飾。コース一覧のカードと同じ仕組み */}
              {ready && (
                <div
                  className="card-art absolute inset-0 -z-10"
                  style={{ backgroundImage: `url(/lab-art/${lab.id}.jpg)` }}
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                    ready ? "bg-accent text-accent-fg" : "border border-border text-fg-subtle",
                  ].join(" ")}
                >
                  {ready ? "できる" : "これから"}
                </span>
                <span className="font-mono text-[0.65rem] text-fg-subtle">約 {lab.minutes} 分</span>
              </div>

              <div>
                <h2 className="text-base font-bold tracking-tight text-fg">{lab.title}</h2>
                <p className="mt-1 text-sm text-fg-muted">{lab.subtitle}</p>
              </div>

              <p className="text-xs leading-relaxed text-fg-subtle">{lab.goal}</p>

              {!ready && lab.plan?.length ? (
                <ul className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
                  {lab.plan.map((line) => (
                    <li key={line} className="flex gap-2 text-xs leading-relaxed text-fg-subtle">
                      <span aria-hidden>·</span>
                      {line}
                    </li>
                  ))}
                </ul>
              ) : null}

              {ready ? (
                <p className="mt-auto pt-2 text-xs font-bold text-accent">はじめる →</p>
              ) : null}
            </article>
          );

          return (
            <li key={lab.id}>
              {ready ? (
                <Link href={`/labs/${lab.id}/`} className="block h-full">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
