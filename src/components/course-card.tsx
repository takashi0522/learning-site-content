"use client";

import Link from "next/link";
import type { Course } from "@/lib/content";
import { useCourseProgress, useProgress } from "@/lib/progress";
import { ProgressBar } from "./progress-bar";

export type CourseCardLesson = {
  /** lessonKey (`courseId/slug`)。既読の判定に使う */
  key: string;
  title: string;
  minutes: number;
};

export type CourseSummary = {
  course: Course;
  lessons: CourseCardLesson[];
  minutes: number;
};

export function CourseCard({ course, lessons, minutes }: CourseSummary) {
  const { done, total, hydrated } = useCourseProgress(lessons.map((lesson) => lesson.key));
  const { state } = useProgress();
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

      {/*
        カード全体が 1 つのリンク (before:absolute inset-0) なので、
        一覧はその上 (z-10) に置いてクリックを受け取れるようにする
      */}
      {total > 0 && (
        <details className="group/list relative z-10 -mx-2 text-sm">
          <summary className="cursor-pointer list-none rounded-md px-2 py-1 font-mono text-[0.7rem] font-bold text-fg-subtle transition hover:text-fg">
            <span className="inline-block transition group-open/list:rotate-90" aria-hidden>
              ›
            </span>{" "}
            レッスン一覧
          </summary>
          <ol className="mt-1 flex flex-col">
            {lessons.map((lesson, i) => {
              const read = hydrated && Boolean(state.completed[lesson.key]);
              return (
                <li key={lesson.key}>
                  <Link
                    href={`/courses/${lesson.key}/`}
                    className="flex items-baseline gap-2 rounded-md px-2 py-1 transition hover:bg-surface-2"
                  >
                    <span className="w-5 shrink-0 font-mono text-[0.7rem] text-fg-subtle">{i + 1}</span>
                    <span className={`flex-1 ${read ? "text-fg-subtle" : "text-fg-muted"}`}>{lesson.title}</span>
                    <span className="shrink-0 font-mono text-[0.65rem] text-fg-subtle">
                      {read ? "読了" : `${lesson.minutes} 分`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </details>
      )}
    </article>
  );
}
