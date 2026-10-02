import type { Metadata } from "next";
import { getCourses, getLessons } from "@/lib/content";
import { CourseCard } from "@/components/course-card";

export const metadata: Metadata = { title: "コース一覧" };

export default function CoursesPage() {
  const courses = getCourses();

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">コース一覧</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">
          「なぜそう動くか」を扱うコースと、「実際に何を打つか」を扱うコースを分けています。
          仕組みが分かると調査の当たりが早くなり、手順が身についていると復旧が速くなります。
        </p>
      </header>

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
    </div>
  );
}
