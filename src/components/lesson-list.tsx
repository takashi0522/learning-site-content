"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress";

export type LessonRow = {
  courseId: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  minutes: number;
  hasVideo: boolean;
};

export function LessonList({ lessons }: { lessons: LessonRow[] }) {
  const { state, hydrated } = useProgress();

  return (
    <ol className="flex flex-col gap-2">
      {lessons.map((lesson) => {
        const key = `${lesson.courseId}/${lesson.slug}`;
        const done = hydrated && Boolean(state.completed[key]);

        return (
          <li key={key}>
            <Link
              href={`/courses/${lesson.courseId}/${lesson.slug}/`}
              className="flex items-start gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition hover:border-accent"
            >
              <span
                className={[
                  "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold",
                  done ? "border-ok bg-ok/15 text-ok" : "border-border text-fg-subtle",
                ].join(" ")}
                aria-hidden
              >
                {done ? "✓" : String(lesson.order).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-bold">{lesson.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">{lesson.description}</p>
              </div>

              <div className="hidden shrink-0 flex-col items-end gap-1 font-mono text-[0.7rem] text-fg-subtle sm:flex">
                <span>{lesson.minutes}分</span>
                {lesson.hasVideo && <span aria-label="動画あり">▶ 動画</span>}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
