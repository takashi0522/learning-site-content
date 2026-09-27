"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress";
import type { LessonRow } from "./lesson-list";

/**
 * トップのダッシュボード。全レッスンの一覧をサーバーから受け取り、
 * 「どこまでやったか」だけをクライアント側の localStorage と突き合わせる。
 */
export function DashboardStats({ lessons }: { lessons: LessonRow[] }) {
  const { state, hydrated, resetAll } = useProgress();

  const done = lessons.filter((l) => state.completed[`${l.courseId}/${l.slug}`]).length;
  const minutesDone = lessons
    .filter((l) => state.completed[`${l.courseId}/${l.slug}`])
    .reduce((sum, l) => sum + l.minutes, 0);

  const quizzes = Object.values(state.quiz);
  const firstTry = quizzes.filter((q) => q.correct && q.attempts === 1).length;

  // 未完了のうち最も順番が前のもの = 次に手を付けるべきレッスン
  const next = lessons.find((l) => !state.completed[`${l.courseId}/${l.slug}`]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-3">
        <Stat label="学習済みレッスン" value={hydrated ? `${done}` : "–"} unit={`/ ${lessons.length}`} />
        <Stat label="積み上げ時間" value={hydrated ? `${minutesDone}` : "–"} unit="分" />
        <Stat
          label="クイズ一発正解"
          value={hydrated ? `${firstTry}` : "–"}
          unit={`/ ${hydrated ? quizzes.length : 0}`}
        />
      </div>

      {hydrated && next && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <span className="font-mono text-[0.7rem] tracking-widest text-fg-subtle uppercase">
            次はこれ
          </span>
          <Link
            href={`/courses/${next.courseId}/${next.slug}/`}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-fg transition hover:brightness-110"
          >
            {next.title} →
          </Link>
        </div>
      )}

      {hydrated && done > 0 && (
        <button
          type="button"
          onClick={() => {
            if (confirm("このブラウザに保存した学習進捗をすべて消します。よろしいですか？")) {
              resetAll();
            }
          }}
          className="mt-4 text-[0.7rem] text-fg-subtle underline underline-offset-2 hover:text-ng"
        >
          進捗をリセット
        </button>
      )}
    </section>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <p className="font-mono text-[0.68rem] tracking-widest text-fg-subtle uppercase">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
        <span className="font-mono text-xs text-fg-subtle">{unit}</span>
      </p>
    </div>
  );
}
