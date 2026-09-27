import { Box, C, T } from "./primitives";

const RAILS = [0, 1, 2, 3];
const NODES = [
  { label: "ノード 1", x: 116 },
  { label: "ノード 2", x: 452 },
];

/**
 * レール最適化。
 *
 * 「全ノードの同じ GPU 番号を同じリーフに集める」という一文は、
 * 線の交差として見せないと伝わらない。ノード 1 の GPU1 とノード 2 の GPU1 が
 * 同じリーフへ向かう斜めの線が、そのままレールの定義になっている。
 */
export function RailOptimized() {
  const leafW = 140;
  const leafY = 40;
  const leafH = 52;
  const gpuY = 196;
  const gpuW = 70;
  const gpuH = 44;
  const leafX = (i: number) => 78 + i * 172;
  const gpuX = (node: number, i: number) => NODES[node].x + i * 78;

  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="レール最適化の配線">
      {NODES.map((n, node) =>
        RAILS.map((i) => (
          <line
            key={`${node}-${i}`}
            x1={gpuX(node, i) + gpuW / 2}
            y1={gpuY}
            x2={leafX(i) + leafW / 2}
            y2={leafY + leafH}
            stroke={i === 0 ? C.accent : C.border}
            strokeWidth={i === 0 ? 2.5 : 1.4}
          />
        )),
      )}

      {RAILS.map((i) => (
        <Box
          key={i}
          x={leafX(i)}
          y={leafY}
          w={leafW}
          h={leafH}
          label={`リーフ ${i + 1}`}
          sub={`レール ${i + 1}`}
          size={12.5}
          tone={i === 0 ? "accent" : "plain"}
        />
      ))}

      {NODES.map((n, node) => (
        <g key={n.label}>
          <Box
            x={n.x - 12}
            y={gpuY - 12}
            w={4 * 78 + 16}
            h={gpuH + 24}
            r={10}
            tone="ghost"
            dashed
          />
          {RAILS.map((i) => (
            <Box
              key={i}
              x={gpuX(node, i)}
              y={gpuY}
              w={gpuW}
              h={gpuH}
              label={`GPU ${i + 1}`}
              size={11.5}
              tone={i === 0 ? "accent" : "plain"}
            />
          ))}
          <T x={n.x + 150} y={gpuY + gpuH + 30} size={12.5} weight={700} fill={C.fg} anchor="middle">
            {n.label}
          </T>
        </g>
      ))}

      <T x={400} y={20} size={12} fill={C.subtle} anchor="middle">
        リーフ層（レールごと）
      </T>
      <T x={400} y={310} size={12} weight={600} fill={C.accent} anchor="middle">
        色を付けた線がレール 1 — どのノードの GPU 1 も、同じリーフ 1 へ向かう
      </T>
    </svg>
  );
}
