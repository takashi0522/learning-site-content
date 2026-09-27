import type { ReactNode } from "react";

/**
 * 図を組むための最小の部品。
 *
 * 色は必ずこのテーブル経由で参照する。生の #rrggbb を書くと、ライト/ダークの
 * 切り替えとコース別アクセント (data-accent) の両方が効かなくなる。
 */
export const C = {
  surface: "var(--surface)",
  surface2: "var(--surface-2)",
  border: "var(--border)",
  fg: "var(--fg)",
  muted: "var(--fg-muted)",
  subtle: "var(--fg-subtle)",
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  accentFg: "var(--accent-fg)",
  ok: "var(--ok)",
  ng: "var(--ng)",
} as const;

export type Tone = "plain" | "accent" | "ok" | "ng" | "ghost";

const TONES: Record<Tone, { fill: string; stroke: string; text: string }> = {
  plain: { fill: C.surface2, stroke: C.border, text: C.fg },
  accent: { fill: C.accentSoft, stroke: C.accent, text: C.fg },
  ok: { fill: "color-mix(in oklab, var(--ok) 12%, transparent)", stroke: C.ok, text: C.fg },
  ng: { fill: "color-mix(in oklab, var(--ng) 12%, transparent)", stroke: C.ng, text: C.fg },
  ghost: { fill: "transparent", stroke: C.border, text: C.muted },
};

/** 角丸の箱。`label` は中央、`sub` はその下に一回り小さく置く。 */
export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  tone = "plain",
  mono = false,
  r = 8,
  size = 14,
  dashed = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  sub?: string;
  tone?: Tone;
  mono?: boolean;
  r?: number;
  size?: number;
  dashed?: boolean;
}) {
  const t = TONES[tone];
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill={t.fill}
        stroke={t.stroke}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      {label ? (
        <T
          x={cx}
          y={sub ? cy - size * 0.58 : cy}
          size={size}
          fill={t.text}
          weight={600}
          mono={mono}
          anchor="middle"
          middle
        >
          {label}
        </T>
      ) : null}
      {sub ? (
        <T x={cx} y={cy + size * 0.82} size={Math.max(size - 2, 11)} fill={C.muted} anchor="middle" middle>
          {sub}
        </T>
      ) : null}
    </g>
  );
}

/** テキスト。`middle` を付けると y を視覚的な中心として扱う。 */
export function T({
  x,
  y,
  children,
  size = 13,
  fill = C.muted,
  weight = 400,
  mono = false,
  anchor = "start",
  middle = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  fill?: string;
  weight?: number;
  mono?: boolean;
  anchor?: "start" | "middle" | "end";
  middle?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={fill}
      fontWeight={weight}
      textAnchor={anchor}
      dominantBaseline={middle ? "central" : undefined}
      style={mono ? { fontFamily: "var(--font-mono)" } : undefined}
    >
      {children}
    </text>
  );
}

/**
 * 矢印。marker ではなく多角形で頭を描いている。
 * marker は id がページ内で一意でないと他の図と衝突するため、意図的に使わない。
 */
export function Arrow({
  from,
  to,
  color = C.subtle,
  width = 1.6,
  head = 7,
  dashed = false,
  bidi = false,
}: {
  from: [number, number];
  to: [number, number];
  color?: string;
  width?: number;
  head?: number;
  dashed?: boolean;
  bidi?: boolean;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const headAt = (px: number, py: number, sx: number, sy: number) => {
    const bx = px - sx * head;
    const by = py - sy * head;
    const nx = -sy * head * 0.45;
    const ny = sx * head * 0.45;
    return `${px},${py} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`;
  };

  return (
    <g>
      <line
        x1={bidi ? x1 + ux * head : x1}
        y1={bidi ? y1 + uy * head : y1}
        x2={x2 - ux * head}
        y2={y2 - uy * head}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "5 4" : undefined}
        strokeLinecap="round"
      />
      <polygon points={headAt(x2, y2, ux, uy)} fill={color} />
      {bidi ? <polygon points={headAt(x1, y1, -ux, -uy)} fill={color} /> : null}
    </g>
  );
}

/** 折れ線の矢印。点を順に結び、最後の区間に頭を付ける。 */
export function Elbow({
  points,
  color = C.subtle,
  width = 1.6,
  head = 7,
  dashed = false,
}: {
  points: [number, number][];
  color?: string;
  width?: number;
  head?: number;
  dashed?: boolean;
}) {
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const dx = last[0] - prev[0];
  const dy = last[1] - prev[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const trimmed = points
    .slice(0, -1)
    .concat([[last[0] - ux * head, last[1] - uy * head]]);
  const nx = -uy * head * 0.45;
  const ny = ux * head * 0.45;
  const bx = last[0] - ux * head;
  const by = last[1] - uy * head;

  return (
    <g>
      <polyline
        points={trimmed.map(([px, py]) => `${px},${py}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "5 4" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${last[0]},${last[1]} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`}
        fill={color}
      />
    </g>
  );
}

/** 帯（レイヤーの背景）。カーネル空間とユーザー空間の境界などに使う。 */
export function Band({
  x,
  y,
  w,
  h,
  label,
  tone = "ghost",
  align = "left",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  tone?: Tone;
  align?: "left" | "right";
}) {
  const t = TONES[tone];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={tone === "ghost" ? C.surface2 : t.fill}
        stroke={t.stroke}
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.55}
      />
      {label ? (
        <T
          x={align === "right" ? x + w - 10 : x + 10}
          y={y + 14}
          size={12}
          fill={C.subtle}
          weight={700}
          anchor={align === "right" ? "end" : "start"}
        >
          {label}
        </T>
      ) : null}
    </g>
  );
}

/** 丸囲みの連番。図と本文の手順を対応させるために使う。 */
export function Step({ x, y, n, tone = "accent" }: { x: number; y: number; n: number; tone?: Tone }) {
  const stroke = TONES[tone].stroke;
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill={C.surface} stroke={stroke} strokeWidth={1.5} />
      <T x={x} y={y} size={12} fill={stroke} weight={700} anchor="middle" middle>
        {n}
      </T>
    </g>
  );
}

/** 右向きの波括弧。複数の箱を 1 つの説明でまとめるときに使う。 */
export function Brace({
  x,
  y1,
  y2,
  label,
  color = C.subtle,
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
  color?: string;
}) {
  const mid = (y1 + y2) / 2;
  const d = `M ${x} ${y1} q 6 0 6 6 L ${x + 6} ${mid - 6} q 0 6 6 6 q -6 0 -6 6 L ${x + 6} ${y2 - 6} q 0 6 -6 6`;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={1.3} />
      <T x={x + 18} y={mid} size={12} fill={color} middle>
        {label}
      </T>
    </g>
  );
}
