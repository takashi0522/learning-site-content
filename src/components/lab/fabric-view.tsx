"use client";

import { C, T } from "@/components/figures/primitives";
import type { LabLink, LabNode } from "@/lib/labs";

const ROW_Y = [26, 130, 234];
const H = 62;

/**
 * 段になったトポロジ図。
 *
 * packet-walk の直線トポロジと違い、ファブリックは「どのリンクを通ったか」が主題になる。
 * そのため、ノードの位置だけでなく**リンクを明示して**、
 * その手順で使われている経路だけを太く描く。
 */
export function FabricView({
  nodes,
  links,
  at,
  path = [],
  down = [],
  rowLabels = [],
}: {
  nodes: LabNode[];
  links: LabLink[];
  at: string;
  path?: string[];
  down?: string[];
  /** 段ごとの役割。ノードの下に個別に書くとリンク線と重なるので、段の左に 1 回だけ出す */
  rowLabels?: { label: string; sub?: string }[];
}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const current = byId.get(at);
  const anchor = (n: LabNode) => ({ cx: n.x + n.w / 2, y: ROW_Y[n.row ?? 0] });

  return (
    <svg
      viewBox="0 0 980 320"
      role="img"
      aria-label={`ファブリックのトポロジ図。現在は ${current?.label ?? at} にいる`}
      className="block h-auto w-full"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {rowLabels.map((row, i) => (
        <g key={row.label}>
          <rect
            x={0}
            y={ROW_Y[i] - 12}
            width={92}
            height={H + 24}
            rx={8}
            fill={C.surface2}
            stroke={C.border}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.55}
          />
          <T x={46} y={ROW_Y[i] + 22} size={12.5} weight={700} fill={C.fg} anchor="middle">
            {row.label}
          </T>
          {row.sub ? (
            <T x={46} y={ROW_Y[i] + 42} size={10.5} fill={C.subtle} anchor="middle">
              {row.sub}
            </T>
          ) : null}
        </g>
      ))}

      {links.map((link) => {
        const a = byId.get(link.from);
        const b = byId.get(link.to);
        if (!a || !b) return null;
        const pa = anchor(a);
        const pb = anchor(b);
        // 上の段のノードは下端、下の段のノードは上端から線を出す
        const y1 = pa.y < pb.y ? pa.y + H : pa.y;
        const y2 = pa.y < pb.y ? pb.y : pb.y + H;
        const active = link.id ? path.includes(link.id) : false;
        const dead = down.includes(link.from) || down.includes(link.to);
        return (
          <line
            key={`${link.from}-${link.to}`}
            x1={pa.cx}
            y1={y1}
            x2={pb.cx}
            y2={y2}
            stroke={dead ? C.ng : active ? C.accent : C.border}
            strokeWidth={active ? 4 : 1.6}
            strokeDasharray={dead ? "6 5" : undefined}
          />
        );
      })}

      {nodes.map((node) => {
        const p = anchor(node);
        const isAt = node.id === at;
        const isDown = down.includes(node.id);
        return (
          <g key={node.id}>
            <rect
              x={node.x}
              y={p.y}
              width={node.w}
              height={H}
              rx={10}
              fill={isDown ? "transparent" : isAt ? C.accentSoft : C.surface}
              stroke={isDown ? C.ng : isAt ? C.accent : C.border}
              strokeWidth={isAt ? 2.5 : 1.5}
              strokeDasharray={isDown ? "5 4" : undefined}
            />
            <T x={p.cx} y={p.y + 25} size={13} weight={700} fill={isDown ? C.ng : C.fg} anchor="middle">
              {node.label}
            </T>
            {node.sub ? (
              <T x={p.cx} y={p.y + 44} size={11.5} fill={C.muted} anchor="middle" mono>
                {node.sub}
              </T>
            ) : null}
            {/*
              種別ラベルは出さない。「スパイン 1」「リーフ 1」のように
              ノード名自体が種別を表しているうえ、段の間はリンク線が通るので重なる。
            */}
            {isDown ? (
              <T x={p.cx} y={p.y + H + 16} size={11} weight={700} fill={C.ng} anchor="middle">
                停止中
              </T>
            ) : null}
          </g>
        );
      })}

      {current ? (
        <g>
          <rect
            x={current.x + current.w / 2 - 40}
            y={anchor(current).y - 30}
            width={80}
            height={22}
            rx={11}
            fill={C.accent}
          />
          <T
            x={current.x + current.w / 2}
            y={anchor(current).y - 19}
            size={11.5}
            weight={700}
            fill={C.accentFg}
            anchor="middle"
            middle
          >
            いまここ
          </T>
        </g>
      ) : null}
    </svg>
  );
}
