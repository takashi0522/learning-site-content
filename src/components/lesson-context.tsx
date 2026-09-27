"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * MDX の中に置いた <Quiz> が「どのレッスンの設問か」を知るための文脈。
 * MDX 側に courseId を毎回書かせないために Context 経由で配る。
 */
type LessonIdentity = { courseId: string; slug: string; lessonKey: string };

const LessonContext = createContext<LessonIdentity | null>(null);

export function LessonProvider({
  courseId,
  slug,
  children,
}: {
  courseId: string;
  slug: string;
  children: ReactNode;
}) {
  return (
    <LessonContext.Provider value={{ courseId, slug, lessonKey: `${courseId}/${slug}` }}>
      {children}
    </LessonContext.Provider>
  );
}

export function useLessonIdentity(): LessonIdentity {
  const context = useContext(LessonContext);
  if (!context) throw new Error("useLessonIdentity must be used inside <LessonProvider>");
  return context;
}
