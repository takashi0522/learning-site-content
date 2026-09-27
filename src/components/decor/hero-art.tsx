import { C } from "@/components/figures/primitives";

/**
 * トップページの装飾。**図ではない。**
 *
 * 情報を持たないので、ラベルも矢印も付けない。読ませずに目を休ませるのが役目で、
 * 「積み上げて覚える」という見出しに合わせて層が浮いているだけの絵にしてある。
 *
 * - 色は figures と同じ `C` 経由。テーマ切り替えにそのまま追従する
 * - `<defs>` とグラデーション id を使わない。id はページ内で一意である必要があり、
 *   将来ここに図が同居したときに衝突する (CLAUDE.md の marker と同じ理由)
 * - `aria-hidden`。読み上げる内容が無い
 */
export function HeroArt() {
  const cx = 210;
  const w = 150;
  const h = 32;
  const depth = 10;

  // 上ほどアクセント色が濃い。下へ向かって背景に溶ける
  const plates = [
    { cy: 66, top: "26%", edge: "38%", stroke: "50%" },
    { cy: 140, top: "18%", edge: "28%", stroke: "34%" },
    { cy: 214, top: "11%", edge: "18%", stroke: "22%" },
    { cy: 288, top: "6%", edge: "11%", stroke: "14%" },
  ];

  const mix = (pct: string) => `color-mix(in oklab, ${C.accent} ${pct}, transparent)`;

  return (
    <svg
      viewBox="0 0 420 340"
      className="h-auto w-full"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      {/* 浮いている粒。上に抜けるほど薄くして、視線が上で止まらないようにする */}
      {[
        [96, 18, 2.5, "34%"],
        [148, 30, 1.8, "24%"],
        [268, 14, 2.2, "30%"],
        [318, 27, 1.6, "20%"],
        [206, 8, 1.4, "18%"],
      ].map(([x, y, r, pct]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={mix(String(pct))} />
      ))}

      {plates.map(({ cy, top, edge, stroke }) => {
        const l = cx - w;
        const r = cx + w;
        const t = cy - h;
        const b = cy + h;
        return (
          <g key={cy}>
            {/* 側面。下へ depth ぶん落として厚みを出す */}
            <polygon
              points={`${l},${cy} ${cx},${b} ${cx},${b + depth} ${l},${cy + depth}`}
              fill={mix(edge)}
            />
            <polygon
              points={`${r},${cy} ${cx},${b} ${cx},${b + depth} ${r},${cy + depth}`}
              fill={mix(edge)}
            />
            {/* 天面 */}
            <polygon
              points={`${cx},${t} ${r},${cy} ${cx},${b} ${l},${cy}`}
              fill={mix(top)}
              stroke={mix(stroke)}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
}
