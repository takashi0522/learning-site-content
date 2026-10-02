import type { Metadata } from "next";
import Link from "next/link";
import { getCourses, getLessons } from "@/lib/content";
import { CourseMap } from "@/components/course-map";

export const metadata: Metadata = { title: "全体の地図" };

export default function MapPage() {
  const courses = getCourses();
  const lessonCounts = Object.fromEntries(courses.map((course) => [course.id, getLessons(course.id).length]));

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">全体の地図</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">
          矢印は「先に読むと良いコース」から伸びています。左のコースほど土台になり、右へ進むほど前のコースの知識を前提にします。
          どこから読んでも構いませんが、分からない言葉が出てきたら矢印を左へたどってください。
        </p>
      </header>

      <CourseMap courses={courses} lessonCounts={lessonCounts} />

      <section>
        <h2 className="mb-3 text-sm font-bold tracking-widest text-fg-subtle">コースごとの前提</h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {courses.map((course) => {
            const pres = (course.prerequisites ?? [])
              .map((id) => courses.find((c) => c.id === id))
              .filter((c) => c !== undefined);
            return (
              <li key={course.id} data-accent={course.accent} className="rounded-lg border border-border px-4 py-3">
                <Link href={`/courses/${course.id}/`} className="font-bold text-accent hover:underline">
                  {course.title}
                </Link>
                <p className="mt-1 text-xs text-fg-muted">
                  {pres.length > 0 ? `前提: ${pres.map((c) => c.title).join("、")}` : "前提なし（ここから読める）"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
