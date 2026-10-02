import { getCourses, getLessons } from "@/lib/content";
import { HeroArt } from "@/components/decor/hero-art";
import { CourseCard } from "@/components/course-card";
import { DashboardStats } from "@/components/dashboard-stats";
import type { LessonRow } from "@/components/lesson-list";

export default function HomePage() {
  const courses = getCourses();

  const allLessons: LessonRow[] = courses.flatMap((course) =>
    getLessons(course.id).map((lesson) => ({
      courseId: lesson.courseId,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      minutes: lesson.minutes,
      hasVideo: Boolean(lesson.video),
    })),
  );

  return (
    <div className="relative isolate flex flex-col gap-12">
      <div className="hero-aura" aria-hidden="true" />
      <div className="dot-field" aria-hidden="true" />

      <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="max-w-2xl">
          <p className="mb-3 font-mono text-[0.7rem] font-bold tracking-widest text-fg-subtle uppercase">
            OS / Server / Network / Middleware
          </p>
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            基盤の「なぜそう動くか」を
            <br />
            積み上げて覚える
          </h1>
          <p className="mt-4 leading-relaxed text-fg-muted">
            手順の暗記ではなく、カーネル・ハードウェア・プロトコルの仕組みから理解するための個人用ノートです。
            各レッスンは記事としてもスライドとしても読めます。
          </p>
        </div>
        {/* 装飾なので、狭い画面では文字を優先して出さない */}
        <div className="hidden md:block">
          <HeroArt />
        </div>
      </section>

      <DashboardStats lessons={allLessons} />

      <section>
        <h2 className="mb-5 text-sm font-bold tracking-widest text-fg-subtle uppercase">コース</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const lessons = getLessons(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                lessons={lessons.map((lesson) => ({
                  key: `${course.id}/${lesson.slug}`,
                  title: lesson.title,
                  minutes: lesson.minutes,
                }))}
                minutes={lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
