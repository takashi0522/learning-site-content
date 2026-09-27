import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLessonParams, getCourse, getLesson, getLessonNeighbors } from "@/lib/content";
import { Mdx } from "@/components/mdx";
import { LessonShell } from "@/components/lesson-shell";
import { VideoEmbed } from "@/components/video-embed";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllLessonParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}): Promise<Metadata> {
  const { course, lesson: slug } = await params;
  const lesson = getLesson(course, slug);
  return lesson ? { title: lesson.title, description: lesson.description } : {};
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const { course: courseId, lesson: slug } = await params;
  const course = getCourse(courseId);
  const lesson = getLesson(courseId, slug);
  if (!course || !lesson) notFound();

  const { prev, next } = getLessonNeighbors(courseId, slug);

  return (
    <div data-accent={course.accent} className="mx-auto flex max-w-3xl flex-col gap-8">
      <div
        className="lesson-band lesson-intro -mb-2"
        style={{ backgroundImage: `url(/course-band/${courseId}.jpg)` }}
        aria-hidden="true"
      />

      <nav className="lesson-intro text-xs text-fg-subtle">
        <Link href="/courses/" className="hover:text-fg">
          コース
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <Link href={`/courses/${courseId}/`} className="hover:text-fg">
          {course.title}
        </Link>
      </nav>

      <header className="lesson-intro">
        <p className="mb-2 font-mono text-[0.7rem] font-bold tracking-widest text-accent uppercase">
          Lesson {String(lesson.order).padStart(2, "0")} · {lesson.minutes} 分
        </p>
        <h1 className="text-2xl leading-snug font-bold tracking-tight sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-3 leading-relaxed text-fg-muted">{lesson.description}</p>

        {lesson.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {lesson.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[0.68rem] text-fg-subtle"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      {lesson.objectives.length > 0 && (
        <section className="lesson-intro rounded-xl border border-border bg-surface px-5 py-4">
          <h2 className="mb-2 font-mono text-[0.68rem] font-bold tracking-widest text-fg-subtle uppercase">
            このレッスンのゴール
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-fg">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex gap-2">
                <span className="text-accent" aria-hidden>
                  →
                </span>
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <LessonShell
        courseId={courseId}
        slug={slug}
        title={lesson.title}
        slides={lesson.slides.map((slide, index) => (
          <Mdx key={index} source={slide} />
        ))}
      >
        {lesson.video && (
          <section>
            <h2 className="mb-2 font-mono text-[0.68rem] font-bold tracking-widest text-fg-subtle uppercase">
              関連動画
            </h2>
            <VideoEmbed
              id={lesson.video.id}
              title={lesson.video.title}
              channel={lesson.video.channel}
            />
          </section>
        )}

        {lesson.references && lesson.references.length > 0 && (
          <section className="rounded-xl border border-border bg-surface px-5 py-4">
            <h2 className="mb-2 font-mono text-[0.68rem] font-bold tracking-widest text-fg-subtle uppercase">
              一次情報
            </h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {lesson.references.map((reference) => (
                <li key={reference.url}>
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-accent underline underline-offset-2"
                  >
                    {reference.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </LessonShell>

      <nav className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/courses/${courseId}/${prev.slug}/`}
            className="rounded-xl border border-border bg-surface px-5 py-4 transition hover:border-accent"
          >
            <p className="font-mono text-[0.68rem] text-fg-subtle">← 前のレッスン</p>
            <p className="mt-1 text-sm font-bold">{prev.title}</p>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/courses/${courseId}/${next.slug}/`}
            className="rounded-xl border border-border bg-surface px-5 py-4 text-right transition hover:border-accent sm:col-start-2"
          >
            <p className="font-mono text-[0.68rem] text-fg-subtle">次のレッスン →</p>
            <p className="mt-1 text-sm font-bold">{next.title}</p>
          </Link>
        )}
      </nav>
    </div>
  );
}
