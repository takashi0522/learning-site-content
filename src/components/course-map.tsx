import type { Course } from "@/lib/content";
import { C, T } from "./figures/primitives";
import { withBase } from "@/lib/base-path";

const BOX_W = 216;
const BOX_PAD_X = 10;
const TITLE_SIZE = 14;
const SUB_SIZE = 12;
const TITLE_LH = 18;
const SUB_LH = 16;
const COL_GAP = 56;
const ROW_GAP = 26;
const PAD = 24;

/**
 * 文字幅の見積もり。SSR なので実測できない。和文は 1em、欧文は広めに 0.62em で見て、
 * 足りなくなる側に倒す (はみ出すより早めに折り返すほうがよい)。
 */
function textWidth(text: string, size: number): number {
  let w = 0;
  for (const ch of text) w += (ch === " " ? 0.32 : ch.charCodeAt(0) < 0x2000 ? 0.62 : 1) * size;
  return w;
}

/** 「・」と空白の直後で切れる単位に分け、幅に収まるよう貪欲に詰める */
function wrap(text: string, size: number, max: number): string[] {
  const tokens = text.match(/[^・ ]+[・ ]?|[・ ]/g) ?? [text];
  const lines: string[] = [];
  let line = "";
  for (const tok of tokens) {
    if (line && textWidth((line + tok).trimEnd(), size) > max) {
      lines.push(line.trimEnd());
      line = tok.trimStart();
    } else {
      line += tok;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

/** 「主題 — 副題」は副題を小さい字で 2 行目以降に回す */
function boxLines(title: string) {
  const max = BOX_W - BOX_PAD_X * 2;
  const [main, ...rest] = title.split(" — ");
  return {
    title: wrap(main, TITLE_SIZE, max),
    sub: rest.length ? wrap(rest.join(" — "), SUB_SIZE, max) : [],
  };
}

type Placed = { course: Course; lessons: number; x: number; y: number };

/**
 * 前提関係 (course.json の prerequisites) から段を決める。
 * 段 = 前提をたどった最長の深さ。前提のないコースが左端に来る。
 */
function layers(courses: Course[]): Map<string, number> {
  const byId = new Map(courses.map((c) => [c.id, c]));
  const depth = new Map<string, number>();
  const visit = (id: string, seen: Set<string>): number => {
    const cached = depth.get(id);
    if (cached !== undefined) return cached;
    if (seen.has(id)) return 0; // 循環は 0 段目に置いて止める
    seen.add(id);
    const pres = (byId.get(id)?.prerequisites ?? []).filter((p) => byId.has(p));
    const d = pres.length === 0 ? 0 : Math.max(...pres.map((p) => visit(p, seen) + 1));
    depth.set(id, d);
    return d;
  };
  courses.forEach((c) => visit(c.id, new Set()));
  return depth;
}

/**
 * 全コースの関係図。図 (figures/) と同じく色は C 経由で、矢印の頭は多角形で描く。
 * ページの幅に収まらない画面では、枠の中だけを横スクロールさせる。
 */
export function CourseMap({ courses, lessonCounts }: { courses: Course[]; lessonCounts: Record<string, number> }) {
  const depth = layers(courses);
  const columns: Course[][] = [];
  for (const course of courses) {
    const d = depth.get(course.id) ?? 0;
    (columns[d] ??= []).push(course);
  }

  // 段の中の並び順: 前提コースの縦位置の平均に寄せる (線の交差を減らすため)
  const rank = new Map<string, number>();
  columns.forEach((col, ci) => {
    if (ci > 0) {
      const key = (c: Course) => {
        const pres = (c.prerequisites ?? []).filter((p) => rank.has(p));
        return pres.length ? pres.reduce((sum, p) => sum + rank.get(p)!, 0) / pres.length : 0;
      };
      col.sort((a, b) => key(a) - key(b));
    }
    col.forEach((c, i) => rank.set(c.id, i - (col.length - 1) / 2));
  });

  // 箱の高さは全コースで揃える (一番行数の多いコースに合わせる)
  const lines = new Map(courses.map((c) => [c.id, boxLines(c.title)]));
  const BOX_H =
    14 +
    Math.max(...[...lines.values()].map((l) => l.title.length * TITLE_LH + l.sub.length * SUB_LH)) +
    SUB_LH +
    12;

  const rows = Math.max(...columns.map((col) => col.length));
  const height = PAD * 2 + rows * BOX_H + (rows - 1) * ROW_GAP;
  const width = PAD * 2 + columns.length * BOX_W + (columns.length - 1) * COL_GAP;

  const placed = new Map<string, Placed>();
  columns.forEach((col, ci) => {
    // 段ごとに縦方向の中央へ寄せる
    const colHeight = col.length * BOX_H + (col.length - 1) * ROW_GAP;
    const top = (height - colHeight) / 2;
    col.forEach((course, ri) => {
      placed.set(course.id, {
        course,
        lessons: lessonCounts[course.id] ?? 0,
        x: PAD + ci * (BOX_W + COL_GAP),
        y: top + ri * (BOX_H + ROW_GAP),
      });
    });
  });

  const edges = courses.flatMap((course) =>
    (course.prerequisites ?? [])
      .filter((pre) => placed.has(pre))
      .map((pre) => ({ from: placed.get(pre)!, to: placed.get(course.id)! })),
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: 820 }}
        role="img"
        aria-label="コースの前提関係。左のコースほど先に読む"
      >
        {edges.map(({ from, to }) => {
          const x1 = from.x + BOX_W;
          const y1 = from.y + BOX_H / 2;
          const x2 = to.x - 2;
          const y2 = to.y + BOX_H / 2;
          const mid = (x1 + x2) / 2;
          return (
            <g key={`${from.course.id}-${to.course.id}`}>
              <path
                d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2 - 7} ${y2}`}
                fill="none"
                stroke={C.subtle}
                strokeWidth={1.4}
                opacity={0.7}
              />
              <polygon points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`} fill={C.subtle} />
            </g>
          );
        })}

        {[...placed.values()].map(({ course, lessons, x, y }) => {
          const { title, sub } = lines.get(course.id)!;
          const cx = x + BOX_W / 2;
          // 文字の塊を箱の縦中央に置く
          const block = title.length * TITLE_LH + sub.length * SUB_LH + SUB_LH + 4;
          const top = y + (BOX_H - block) / 2;
          const subTop = top + title.length * TITLE_LH;
          const countY = subTop + sub.length * SUB_LH + SUB_LH + 1;
          return (
            <a key={course.id} href={withBase(`/courses/${course.id}/`)} data-accent={course.accent}>
              <title>{course.title}</title>
              <rect x={x} y={y} width={BOX_W} height={BOX_H} rx={10} fill={C.accentSoft} stroke={C.accent} strokeWidth={1.5} />
              {title.map((line, i) => (
                <T key={`t${i}`} x={cx} y={top + (i + 1) * TITLE_LH - 4} size={TITLE_SIZE} weight={700} fill={C.fg} anchor="middle">
                  {line}
                </T>
              ))}
              {sub.map((line, i) => (
                <T key={`s${i}`} x={cx} y={subTop + (i + 1) * SUB_LH - 3} size={SUB_SIZE} fill={C.fg} anchor="middle">
                  {line}
                </T>
              ))}
              <T x={cx} y={countY} size={SUB_SIZE} anchor="middle">
                {`${lessons} レッスン・${course.level}`}
              </T>
            </a>
          );
        })}
      </svg>
    </div>
  );
}
