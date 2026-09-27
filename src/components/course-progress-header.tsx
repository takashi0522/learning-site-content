"use client";

import { useCourseProgress } from "@/lib/progress";
import { ProgressBar } from "./progress-bar";

export function CourseProgressHeader({
  lessonKeys,
  minutes,
  level,
}: {
  lessonKeys: string[];
  minutes: number;
  level: string;
}) {
  const { done, total, hydrated } = useCourseProgress(lessonKeys);

  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4">
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.7rem] text-fg-subtle">
        <span>{total} レッスン</span>
        <span>約 {minutes} 分</span>
        <span>{level}</span>
      </div>
      <ProgressBar done={done} total={total} hydrated={hydrated} />
    </div>
  );
}
