import type { ReactNode } from "react";

type CalloutKind = "note" | "tip" | "warning" | "pitfall" | "field";

const PRESETS: Record<CalloutKind, { label: string; icon: string; tone: string }> = {
  note: { label: "補足", icon: "i", tone: "border-border bg-surface-2" },
  tip: { label: "コツ", icon: "★", tone: "border-accent/40 bg-accent-soft" },
  warning: { label: "注意", icon: "!", tone: "border-ng/40 bg-ng/8" },
  pitfall: { label: "よくある誤解", icon: "?", tone: "border-ng/40 bg-ng/8" },
  field: { label: "現場では", icon: "⚙", tone: "border-ok/40 bg-ok/8" },
};

/**
 * MDX 本文中の補足ボックス。
 * `field` は「実務でどう効くか」を書くための枠で、教科書的な説明と体験知を視覚的に分ける。
 */
export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutKind;
  title?: string;
  children: ReactNode;
}) {
  const preset = PRESETS[type] ?? PRESETS.note;

  return (
    <aside className={`not-prose my-6 rounded-xl border px-5 py-4 ${preset.tone}`}>
      <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-fg">
        <span
          className="inline-flex size-5 items-center justify-center rounded-full bg-fg/10 font-mono text-[0.7rem]"
          aria-hidden
        >
          {preset.icon}
        </span>
        {title ?? preset.label}
      </p>
      <div className="callout-body text-sm leading-relaxed text-fg-muted [&>*+*]:mt-2 [&_a]:text-accent [&_a]:underline [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:bg-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_li]:ml-4 [&_ul]:list-disc">
        {children}
      </div>
    </aside>
  );
}
