import GithubSlugger from "github-slugger";
import { getCourses, getLesson, getLessons, splitSlides } from "./content";
import { getReadyLabs } from "./labs";

/**
 * サイト内検索の索引。ビルド時に作って `/search-index.json` として書き出す。
 *
 * 1 件 = レッスンの 1 節 (見出しから次の見出しまで)。検索結果から節の見出しへ
 * 直接飛べるよう、見出しのアンカーを rehype-slug と同じ規則で計算しておく。
 */
export type SearchEntry = {
  /** 遷移先。節なら `#anchor` まで含む */
  href: string;
  courseTitle: string;
  /** data-accent に使う */
  accent: string;
  lessonTitle: string;
  /** 節の見出し。レッスン冒頭 (最初の見出しより前) とラボは空 */
  heading: string;
  /** レッスン単位で効く語 (説明・タグ・到達目標)。節ごとに複製しない */
  meta: string;
  /** 節の本文から記法を剥がしたもの */
  text: string;
};

/**
 * rehype-slug は見出しのテキストを github-slugger に通す。
 * Markdown の装飾 (`**`, `` ` ``, リンク) は描画後のテキストに残らないので、ここでも剥がす。
 * `_` は識別子の一部として残る (このサイトでは `_` による強調を使っていない)。
 */
function headingText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*`]/g, "")
    .trim();
}

/** 本文から MDX/Markdown の記法を剥がして、検索とスニペット表示に使う平文にする。 */
function plainText(markdown: string): string {
  return markdown
    .replace(/<h2 className="slide-cont">[\s\S]*?<\/h2>/g, " ") // スライド用の継続見出し。記事には出ない
    .replace(/<[^>]+>/g, " ") // JSX タグ (属性ごと)
    .replace(/^\s*```.*$/gm, " ") // コードフェンスの行そのもの。中身は残す
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s*\|[\s|:-]*-[\s|:-]*$/gm, " ") // 表の区切り行 (| --- | --- |)
    .replace(/[*`#>|]/g, " ") // `_` は識別子 (stripe_count など) に使われるので残す
    .replace(/\s+/g, " ")
    .trim();
}

function lessonEntries(courseId: string, slug: string, courseTitle: string, accent: string): SearchEntry[] {
  const lesson = getLesson(courseId, slug);
  if (!lesson) return [];

  const base = `/courses/${courseId}/${slug}/`;
  const meta = [lesson.description, ...lesson.tags, ...lesson.objectives].join(" ");
  const entries: SearchEntry[] = [];

  let heading = "";
  let anchor = "";
  let buffer: string[] = [];
  const flush = () => {
    const text = plainText(buffer.join("\n"));
    if (text || heading) {
      entries.push({
        href: anchor ? `${base}#${anchor}` : base,
        courseTitle,
        accent,
        lessonTitle: lesson.title,
        heading,
        meta,
        text,
      });
    }
    buffer = [];
  };

  // スライドは 1 枚ずつ別々にコンパイルされるので、アンカーの重複番号もスライド単位で数え直される
  for (const slide of splitSlides(lesson.body)) {
    const slugger = new GithubSlugger();
    let fence = false;
    for (const line of slide.split(/\r?\n/)) {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence;
      const match = !fence && line.match(/^(#{2,3})\s+(.+?)\s*$/);
      if (match) {
        flush();
        heading = headingText(match[2]);
        anchor = slugger.slug(heading);
        continue;
      }
      buffer.push(line);
    }
  }
  flush();

  return entries;
}

export function buildSearchIndex(): SearchEntry[] {
  const lessons = getCourses()
    .filter((course) => course.status === "ready")
    .flatMap((course) =>
      getLessons(course.id).flatMap((lesson) => lessonEntries(course.id, lesson.slug, course.title, course.accent)),
    );

  const labs = getReadyLabs().map<SearchEntry>((lab) => ({
    href: `/labs/${lab.id}/`,
    courseTitle: "ラボ",
    accent: lab.accent,
    lessonTitle: lab.title,
    heading: "",
    meta: [lab.subtitle, lab.goal, ...(lab.summary ?? [])].join(" "),
    text: "",
  }));

  return [...lessons, ...labs];
}
