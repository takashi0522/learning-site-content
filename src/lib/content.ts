import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * 教材の実体は content/<courseId>/<NN-slug>.mdx。
 * コース単位のメタデータは content/<courseId>/course.json。
 * すべてビルド時にファイルシステムから読む (静的エクスポートなのでランタイムI/Oは発生しない)。
 */
const CONTENT_ROOT = path.join(process.cwd(), "content");

export type CourseStatus = "ready" | "draft";

export type Course = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  order: number;
  /** globals.css で定義したアクセント色トークンのキー */
  accent:
    | "linux"
    | "ops"
    | "hardware"
    | "gpu"
    | "network"
    | "facility"
    | "ai"
    | "middleware"
    | "auth"
    | "buildout"
    | "gpunet"
    | "mlwork";
  level: string;
  status: CourseStatus;
  /** コースページ冒頭の「このコースで学べること」。各レッスンの到達目標を 3〜4 項目にまとめたもの */
  goals?: string[];
  /** 先に読むと良いコースの id。コースページと /map/ の矢印に使う */
  prerequisites?: string[];
};

export type VideoRef = {
  provider: "youtube";
  id: string;
  title: string;
  /** 出典表記に使う配信元名 */
  channel?: string;
};

export type LessonMeta = {
  courseId: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  /** 想定学習時間 (分) */
  minutes: number;
  tags: string[];
  objectives: string[];
  video?: VideoRef;
  references?: { label: string; url: string }[];
};

export type Lesson = LessonMeta & {
  /** 記事モード用の MDX 本文 (スライド区切りも含む全文) */
  body: string;
  /** スライドモード用に `---` で分割した各ページの MDX */
  slides: string[];
};

/** 学習進捗の ID。localStorage のキーにもなるので安定した形にする。 */
export function lessonKey(courseId: string, slug: string): string {
  return `${courseId}/${slug}`;
}

function readCourseDirs(): string[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];
  return fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function getCourses(): Course[] {
  return readCourseDirs()
    .map((id) => getCourse(id))
    .filter((course): course is Course => course !== null)
    .sort((a, b) => a.order - b.order);
}

export function getCourse(id: string): Course | null {
  const metaPath = path.join(CONTENT_ROOT, id, "course.json");
  if (!fs.existsSync(metaPath)) return null;
  const raw = JSON.parse(fs.readFileSync(metaPath, "utf8")) as Omit<Course, "id">;
  return { id, ...raw };
}

/**
 * ファイル名の先頭 NN- を並び順に使う。frontmatter の order があればそちらを優先。
 */
export function getLessons(courseId: string): LessonMeta[] {
  const dir = path.join(CONTENT_ROOT, courseId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "").replace(/^\d+-/, "");
      return getLesson(courseId, slug);
    })
    .filter((lesson): lesson is Lesson => lesson !== null)
    .sort((a, b) => a.order - b.order)
    .map(({ body: _body, slides: _slides, ...meta }) => meta);
}

function resolveLessonFile(courseId: string, slug: string): string | null {
  const dir = path.join(CONTENT_ROOT, courseId);
  if (!fs.existsSync(dir)) return null;
  const match = fs
    .readdirSync(dir)
    .find((file) => file.endsWith(".mdx") && file.replace(/\.mdx$/, "").replace(/^\d+-/, "") === slug);
  return match ? path.join(dir, match) : null;
}

export function getLesson(courseId: string, slug: string): Lesson | null {
  const file = resolveLessonFile(courseId, slug);
  if (!file) return null;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const filePrefix = Number(path.basename(file).match(/^(\d+)-/)?.[1] ?? 0);

  return {
    courseId,
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    order: Number(data.order ?? filePrefix),
    minutes: Number(data.minutes ?? 10),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    objectives: Array.isArray(data.objectives) ? data.objectives.map(String) : [],
    video: data.video as VideoRef | undefined,
    references: data.references as { label: string; url: string }[] | undefined,
    body: content.trim(),
    slides: splitSlides(content),
  };
}

/**
 * 本文を水平線 (`---` だけの行) でスライドに分割する。
 * frontmatter は gray-matter が先に剥がしているので、ここに来る `---` は必ず区切り。
 * コードフェンス内の `---` を誤検出しないよう、フェンスの開閉を追跡する。
 */
export function splitSlides(body: string): string[] {
  const slides: string[] = [];
  let current: string[] = [];
  let fence: string | null = null;

  for (const line of body.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker.startsWith(fence[0]) && marker.length >= fence.length) fence = null;
    }

    if (fence === null && /^\s*---\s*$/.test(line)) {
      slides.push(current.join("\n").trim());
      current = [];
      continue;
    }
    current.push(line);
  }
  slides.push(current.join("\n").trim());

  return slides.filter((slide) => slide.length > 0);
}

/** generateStaticParams 用: 全レッスンの (course, lesson) 組み合わせ */
export function getAllLessonParams(): { course: string; lesson: string }[] {
  return getCourses().flatMap((course) =>
    getLessons(course.id).map((lesson) => ({ course: course.id, lesson: lesson.slug })),
  );
}

/** コース内での前後のレッスン。レッスン下部のナビゲーションに使う。 */
export function getLessonNeighbors(courseId: string, slug: string) {
  const lessons = getLessons(courseId);
  const index = lessons.findIndex((lesson) => lesson.slug === slug);
  return {
    prev: index > 0 ? lessons[index - 1] : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}

export function countLessons(courseId: string): number {
  return getLessons(courseId).length;
}
