"use client";

import { useRef, useState } from "react";
import type { RackItem } from "@/lib/labs";
import { isSideMounted, type Placed, type Slot } from "@/lib/rack";

/** 1U あたりの高さ。目盛りと機器の高さをこの 1 つの値で揃える。 */
const U_PX = 14;

const KIND_STYLE: Record<RackItem["kind"], string> = {
  server: "border-accent/50 bg-accent-soft text-fg",
  switch: "border-ok/50 bg-ok/10 text-fg",
  gpu: "border-ng/50 bg-ng/10 text-fg",
  pdu: "border-fg-subtle/60 bg-surface-2 text-fg",
  blank: "border-border bg-surface-2 text-fg-subtle",
};

/**
 * ラックの見た目。
 *
 * U 番号は実機と同じく下が 1、上が 42。機器は上から詰める。
 * 目盛りと機器の高さは U_PX で揃えてあるので、「何 U 目に何があるか」が目で追える。
 *
 * 並べ替えはドラッグで行う。PDU のケーブル到達距離のように
 * **位置が結果を変える**制約があるので、並び順は飾りではない。
 */
export function RackView({
  units,
  slots,
  sideMounted,
  freeUnits,
  outOfReachKeys,
  reachLabel = "電源が届かない",
  onRemove,
  onMove,
}: {
  units: number;
  slots: Slot[];
  sideMounted: Placed[];
  freeUnits: number;
  outOfReachKeys: Set<string>;
  /** 何のケーブルが届いていないのか。電源とネットワークで文言が変わる */
  reachLabel?: string;
  onRemove: (key: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  // つかんでいる位置は ref で持つ。state だと dragstart の更新が
  // 同じティック内の drop に間に合わず、移動が落ちることがある。
  const draggingRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  return (
    <div className="flex gap-2">
      <Ruler units={units} />

      <div className="flex-1 rounded-lg border border-border bg-bg p-1">
        {slots.map((slot, i) => {
          const { item } = slot.placed;
          const unreachable = outOfReachKeys.has(slot.placed.key);
          return (
            <div
              key={slot.placed.key}
              draggable
              onDragStart={() => {
                draggingRef.current = i;
                setDragging(i);
              }}
              onDragEnd={() => {
                draggingRef.current = null;
                setDragging(null);
                setOver(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setOver(i);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const from = draggingRef.current;
                if (from !== null && from !== i) onMove(from, i);
                draggingRef.current = null;
                setDragging(null);
                setOver(null);
              }}
              className={[
                "flex cursor-grab items-center gap-2 rounded border px-2 text-[0.7rem] font-bold transition active:cursor-grabbing",
                KIND_STYLE[item.kind],
                unreachable ? "outline outline-2 outline-ng" : "",
                over === i && dragging !== null && dragging !== i ? "ring-2 ring-accent" : "",
                dragging === i ? "opacity-40" : "",
              ].join(" ")}
              style={{ height: `${item.u * U_PX}px` }}
            >
              <span aria-hidden className="shrink-0 opacity-40">
                ⠿
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {unreachable ? (
                <span className="shrink-0 font-normal text-ng">{reachLabel}</span>
              ) : null}
              <span className="shrink-0 font-mono font-normal opacity-60">
                {slot.bottomU === slot.topU ? `U${slot.topU}` : `U${slot.bottomU}-${slot.topU}`}
              </span>
              <button
                type="button"
                onClick={() => onRemove(slot.placed.key)}
                aria-label={`${item.label} を取り外す`}
                className="shrink-0 rounded px-1 font-normal opacity-50 hover:bg-fg/10 hover:opacity-100"
              >
                ×
              </button>
            </div>
          );
        })}

        {freeUnits > 0 ? (
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const from = draggingRef.current;
              if (from !== null) onMove(from, slots.length - 1);
              draggingRef.current = null;
              setDragging(null);
              setOver(null);
            }}
            className="flex items-center justify-center rounded border border-dashed border-border text-[0.7rem] text-fg-subtle"
            style={{ height: `${Math.max(freeUnits * U_PX, 22)}px` }}
          >
            空き {freeUnits}U（熱気の通り道）
          </div>
        ) : null}
      </div>

      {sideMounted.length > 0 ? (
        <div className="flex w-24 flex-col gap-1">
          <p className="text-center text-[0.65rem] font-bold text-fg-subtle">側面（0U）</p>
          {sideMounted.map((p) => (
            <div
              key={p.key}
              className="flex flex-1 flex-col items-center justify-center gap-1 rounded border border-fg-subtle/60 bg-surface-2 px-1 py-2 text-center text-[0.65rem] font-bold text-fg"
            >
              <span>{p.item.label}</span>
              <span className="font-mono font-normal text-fg-subtle">{p.item.outlets}口</span>
              <button
                type="button"
                onClick={() => onRemove(p.key)}
                aria-label={`${p.item.label} を取り外す`}
                className="rounded px-1 font-normal text-fg-subtle hover:bg-fg/10 hover:text-fg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** U 番号の目盛り。5U ごとに数字を出す。 */
function Ruler({ units }: { units: number }) {
  return (
    <div className="w-8 shrink-0 pt-1" aria-hidden>
      {Array.from({ length: units }, (_, i) => {
        const u = units - i;
        const major = u % 5 === 0 || u === 1;
        return (
          <div
            key={u}
            className="flex items-center justify-end gap-1 pr-1"
            style={{ height: `${U_PX}px` }}
          >
            {major ? (
              <span className="font-mono text-[0.6rem] leading-none text-fg-subtle">{u}</span>
            ) : null}
            <span
              className={major ? "h-px w-2 bg-fg-subtle" : "h-px w-1 bg-border"}
              aria-hidden
            />
          </div>
        );
      })}
    </div>
  );
}

export { isSideMounted, U_PX };
