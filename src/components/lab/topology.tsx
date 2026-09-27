"use client";

import { C, T } from "@/components/figures/primitives";
import type { LabFrame, LabNode } from "@/lib/labs";

const Y = 72;
const H = 68;
const MID = Y + H / 2;

const KIND_LABEL: Record<LabNode["kind"], string> = {
  host: "ホスト",
  switch: "L2 スイッチ",
  router: "ルータ",
  spine: "スパイン",
  leaf: "リーフ",
};

/**
 * ラボのトポロジ図。図 (components/figures) と同じ描き方だが、
 * 現在地に応じて見た目が変わるためクライアント側に置いている。
 * 色の参照だけは figures/primitives の C を共有する。
 */
export function Topology({
  nodes,
  segments,
  at,
}: {
  nodes: LabNode[];
  segments: { label: string; from: string; to: string }[];
  at: string;
}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const current = byId.get(at);

  return (
    <svg
      viewBox="0 0 880 196"
      role="img"
      aria-label={`トポロジ図。現在は ${current?.label ?? at} にいる`}
      className="block h-auto w-full"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {segments.map((seg) => {
        const from = byId.get(seg.from);
        const to = byId.get(seg.to);
        if (!from || !to) return null;
        const x = from.x - 14;
        const right = to.id === seg.to && to.kind === "router" ? to.x + to.w / 2 : to.x + to.w + 14;
        return (
          <g key={seg.label}>
            <rect
              x={x}
              y={40}
              width={right - x}
              height={128}
              rx={12}
              fill={C.surface2}
              stroke={C.border}
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <T x={x + 12} y={32} size={12} weight={700} fill={C.subtle}>
              {seg.label}
            </T>
          </g>
        );
      })}

      {nodes.slice(0, -1).map((node, i) => {
        const next = nodes[i + 1];
        return (
          <line
            key={node.id}
            x1={node.x + node.w}
            y1={MID}
            x2={next.x}
            y2={MID}
            stroke={C.border}
            strokeWidth={2}
          />
        );
      })}

      {nodes.map((node) => {
        const active = node.id === at;
        return (
          <g key={node.id}>
            <rect
              x={node.x}
              y={Y}
              width={node.w}
              height={H}
              rx={10}
              fill={active ? C.accentSoft : C.surface}
              stroke={active ? C.accent : C.border}
              strokeWidth={active ? 2.5 : 1.5}
            />
            <T x={node.x + node.w / 2} y={Y + 26} size={13} weight={700} fill={C.fg} anchor="middle">
              {node.label}
            </T>
            {node.sub ? (
              <T x={node.x + node.w / 2} y={Y + 46} size={11.5} fill={C.muted} anchor="middle" mono>
                {node.sub}
              </T>
            ) : null}
            <T x={node.x + node.w / 2} y={Y + H + 18} size={11} fill={C.subtle} anchor="middle">
              {KIND_LABEL[node.kind]}
            </T>
          </g>
        );
      })}

      {current ? (
        <g>
          <rect
            x={current.x + current.w / 2 - 40}
            y={Y - 34}
            width={80}
            height={24}
            rx={12}
            fill={C.accent}
          />
          <T
            x={current.x + current.w / 2}
            y={Y - 22}
            size={11.5}
            weight={700}
            fill={C.accentFg}
            anchor="middle"
            middle
          >
            いまここ
          </T>
          <path
            d={`M ${current.x + current.w / 2 - 5} ${Y - 10} L ${current.x + current.w / 2 + 5} ${Y - 10} L ${current.x + current.w / 2} ${Y - 3} Z`}
            fill={C.accent}
          />
        </g>
      ) : null}
    </svg>
  );
}

const FIELDS: { key: keyof LabFrame; label: string; layer: "L2" | "L3" }[] = [
  { key: "srcMac", label: "送信元 MAC", layer: "L2" },
  { key: "dstMac", label: "宛先 MAC", layer: "L2" },
  { key: "srcIp", label: "送信元 IP", layer: "L3" },
  { key: "dstIp", label: "宛先 IP", layer: "L3" },
  { key: "ttl", label: "TTL", layer: "L3" },
];

/**
 * いま線の上を流れているフレームのヘッダ。
 * 直前の手順から変わった欄を強調することで、
 * 「L2 は毎ホップ変わる / L3 は変わらない」が積み上がって見えるようにしている。
 */
export function FrameHeaders({
  frame,
  changed = [],
  macs,
}: {
  frame: LabFrame | null | undefined;
  changed?: (keyof LabFrame)[];
  macs: Record<string, string>;
}) {
  if (!frame) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-fg-subtle">
        まだフレームは組み立てられていません
      </p>
    );
  }

  const value = (key: keyof LabFrame) => {
    const raw = frame[key];
    if (raw === undefined) return "—";
    return macs[String(raw)] ?? String(raw);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(["L2", "L3"] as const).map((layer) => (
        <div key={layer} className="rounded-xl border border-border bg-surface px-4 py-3">
          <p className="mb-2 text-xs font-bold text-fg-subtle">
            {layer === "L2" ? "L2 ヘッダ（イーサネット）" : "L3 ヘッダ（IP）"}
          </p>
          <dl className="flex flex-col gap-1.5">
            {FIELDS.filter((f) => f.layer === layer).map((field) => {
              const isChanged = changed.includes(field.key);
              return (
                <div key={field.key} className="flex items-baseline justify-between gap-3">
                  <dt className="shrink-0 text-xs text-fg-muted">{field.label}</dt>
                  <dd
                    className={`truncate rounded px-1.5 py-0.5 font-mono text-xs ${
                      isChanged ? "bg-accent-soft font-bold text-fg" : "text-fg-muted"
                    }`}
                  >
                    {value(field.key)}
                    {isChanged ? <span className="ml-1.5 text-[0.65rem] text-accent">変化</span> : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}
