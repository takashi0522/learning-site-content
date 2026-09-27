"use client";

export function ProgressBar({
  done,
  total,
  /** localStorage 読み込み前は 0% 固定にして、実値が入ったときだけ動かす */
  hydrated,
  showLabel = true,
}: {
  done: number;
  total: number;
  hydrated: boolean;
  showLabel?: boolean;
}) {
  const ratio = total === 0 ? 0 : done / total;
  const percent = Math.round(ratio * 100);

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={hydrated ? done : 0}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="学習進捗"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: hydrated ? `${percent}%` : "0%" }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 font-mono text-[0.7rem] text-fg-subtle tabular-nums">
          {hydrated ? `${done}/${total}` : `–/${total}`}
        </span>
      )}
    </div>
  );
}
