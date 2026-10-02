import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getCourses, getLessons } from "@/lib/content";
import { LessonList, type LessonRow } from "@/components/lesson-list";
import { CourseProgressHeader } from "@/components/course-progress-header";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCourses().map((course) => ({ course: course.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course: string }>;
}): Promise<Metadata> {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  return course ? { title: course.title, description: course.description } : {};
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  const lessons = getLessons(courseId);
  const goals = course.goals ?? [];
  const prerequisites = (course.prerequisites ?? [])
    .map((id) => getCourse(id))
    .filter((pre): pre is NonNullable<typeof pre> => pre !== null);
  const rows: LessonRow[] = lessons.map((lesson) => ({
    courseId: lesson.courseId,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    minutes: lesson.minutes,
    hasVideo: Boolean(lesson.video),
  }));

  return (
    <div data-accent={course.accent} className="flex flex-col gap-8">
      <nav className="text-xs text-fg-subtle">
        <Link href="/courses/" className="hover:text-fg">
          コース
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-fg-muted">{course.title}</span>
      </nav>

      <header className="max-w-2xl">
        <p className="mb-2 font-mono text-[0.7rem] font-bold tracking-widest text-accent uppercase">
          {course.subtitle}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">{course.description}</p>
      </header>

      {(goals.length > 0 || prerequisites.length > 0) && (
        <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_14rem]">
          {goals.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-bold tracking-widest text-fg-subtle">このコースで学べること</h2>
              <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
                {goals.map((goal) => (
                  <li key={goal} className="flex gap-2">
                    <span className="text-accent" aria-hidden>
                      →
                    </span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {prerequisites.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-bold tracking-widest text-fg-subtle">先に読むと良いコース</h2>
              <ul className="flex flex-col gap-1.5 text-sm">
                {prerequisites.map((pre) => (
                  <li key={pre.id} data-accent={pre.accent}>
                    <Link href={`/courses/${pre.id}/`} className="font-bold text-accent hover:underline">
                      {pre.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/map/" className="mt-3 inline-block text-xs text-fg-subtle hover:text-fg">
                全体の地図を見る →
              </Link>
            </div>
          )}
        </section>
      )}

      <CourseProgressHeader
        lessonKeys={rows.map((row) => `${row.courseId}/${row.slug}`)}
        minutes={lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)}
        level={course.level}
      />

      {rows.length > 0 ? (
        <LessonList lessons={rows} />
      ) : (
        <p className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-fg-subtle">
          このコースはまだ準備中です。
        </p>
      )}
    </div>
  );
}
