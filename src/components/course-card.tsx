"use client";

import Link from "next/link";
import type { Course } from "@/lib/content";
import { useCourseProgress } from "@/lib/progress";
import { ProgressBar } from "./progress-bar";

export type CourseSummary = {
  course: Course;
  /** このコースに属する全レッスンの lessonKey */
  lessonKeys: string[];
  minutes: number;
};

export function CourseCard({ course, lessonKeys, minutes }: CourseSummary) {
  const { done, total, hydrated } = useCourseProgress(lessonKeys);
  const draft = course.status === "draft";

  return (
    <article
      data-accent={course.accent}
      className="group relative isolate flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition hover:border-accent"
    >
      {/* 装飾。-z-10 で本文の下、カード背景の上に入る (isolate で外へ抜けないようにしている) */}
      <div
        className="card-art absolute inset-0 -z-10"
        style={{ backgroundImage: `url(/course-art/${course.id}.jpg)` }}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-[0.68rem] font-bold tracking-widest text-accent uppercase">
            {course.subtitle}
          </p>
          <h3 className="text-lg font-bold tracking-tight">
            <Link href={`/courses/${course.id}/`} className="before:absolute before:inset-0">
              {course.title}
            </Link>
          </h3>
        </div>
        {draft && (
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[0.65rem] font-bold text-fg-subtle">
            準備中
          </span>
        )}
      </div>

      <p className="flex-1 text-sm leading-relaxed text-fg-muted">{course.description}</p>

      <dl className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem] text-fg-subtle">
        <div className="flex gap-1">
          <dt className="sr-only">レッスン数</dt>
          <dd>{total} レッスン</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">想定時間</dt>
          <dd>約 {minutes} 分</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">レベル</dt>
          <dd>{course.level}</dd>
        </div>
      </dl>

      {total > 0 && <ProgressBar done={done} total={total} hydrated={hydrated} />}
    </article>
  );
}
