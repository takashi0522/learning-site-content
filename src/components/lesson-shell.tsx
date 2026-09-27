"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useProgress } from "@/lib/progress";
import { LessonProvider } from "./lesson-context";
import { SlideStage } from "./slide-stage";

type Mode = "article" | "slides";

type LessonShellProps = {
  courseId: string;
  slug: string;
  title: string;
  /** サーバー側でコンパイル済みの各スライド。記事モードでも同じノードを積んで使う。 */
  slides: ReactNode[];
  children?: ReactNode;
};

/**
 * 1 つの MDX を「記事」と「スライド」の 2 通りで見せる外枠。
 * どちらのモードでも描画しているのは同じスライド配列なので、
 * 教材を二重に書く必要がなく、HTML も重複しない。
 */
export function LessonShell({ courseId, slug, title, slides, children }: LessonShellProps) {
  const lessonKey = `${courseId}/${slug}`;
  const { state, hydrated, setCompleted, rememberSlide } = useProgress();

  const [mode, setMode] = useState<Mode>("article");
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const last = slides.length - 1;

  const done = hydrated && Boolean(state.completed[lessonKey]);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(last, next));
      setIndex(clamped);
      rememberSlide(lessonKey, clamped);
    },
    [last, lessonKey, rememberSlide],
  );

  // スライドモードに入るときだけ、前回の続きから再開する
  function enterSlides() {
    const saved = state.lastSlide[lessonKey] ?? 0;
    setIndex(Math.max(0, Math.min(last, saved)));
    setMode("slides");
  }

  // スライド中はレッスン見出しなどを畳み、スライドだけで 1 画面に収める。
  // 見出しの表示切り替えは CSS 側 (body[data-slide-mode]) が行う。
  useEffect(() => {
    if (mode !== "slides") return;
    document.body.dataset.slideMode = "on";
    window.scrollTo({ top: 0 });
    return () => {
      delete document.body.dataset.slideMode;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "slides") return;

    function onKey(event: KeyboardEvent) {
      // 図の拡大表示が開いている間は、矢印も Esc もそちらのもの。
      // ここで奪うと、図を閉じるつもりの Esc でスライドモードごと抜けてしまう。
      if (document.querySelector("dialog[open]")) return;

      const target = event.target as HTMLElement | null;
      // クイズのボタン上での Space/Enter は選択操作なので奪わない
      if (target && /^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test(target.tagName)) {
        if (event.key === " " || event.key === "Enter") return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          event.preventDefault();
          go(index + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          go(index - 1);
          break;
        case "Home":
          event.preventDefault();
          go(0);
          break;
        case "End":
          event.preventDefault();
          go(last);
          break;
        case "Escape":
          setMode("article");
          break;
        case "f":
        case "F":
          if (stageRef.current) {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void stageRef.current.requestFullscreen?.();
          }
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, index, last, go]);

  return (
    <LessonProvider courseId={courseId} slug={slug}>
      <div className="flex flex-col gap-6">
        <ModeSwitch mode={mode} onArticle={() => setMode("article")} onSlides={enterSlides} />

        {mode === "article" ? (
          <article className="prose max-w-none">
            {slides.map((slide, i) => (
              <section key={i}>
                {i > 0 && <hr />}
                {slide}
              </section>
            ))}
          </article>
        ) : (
          <div
            ref={stageRef}
            className="slide-view flex flex-col rounded-2xl border border-border bg-surface"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
              <p className="truncate text-xs font-bold text-fg-muted">{title}</p>
              <p className="shrink-0 font-mono text-xs text-fg-subtle">
                {index + 1} / {slides.length}
              </p>
            </div>

            <SlideStage key={index}>{slides[index]}</SlideStage>

            <SlideControls
              index={index}
              total={slides.length}
              onGo={go}
              onExit={() => setMode("article")}
            />
          </div>
        )}

        <CompleteButton
          done={done}
          hydrated={hydrated}
          onToggle={() => setCompleted(lessonKey, !done)}
        />

        {children}
      </div>
    </LessonProvider>
  );
}

function ModeSwitch({
  mode,
  onArticle,
  onSlides,
}: {
  mode: Mode;
  onArticle: () => void;
  onSlides: () => void;
}) {
  const base = "rounded-md px-3 py-1.5 text-xs font-bold transition";
  const on = "bg-accent text-accent-fg";
  const off = "text-fg-muted hover:text-fg";

  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1"
        role="group"
        aria-label="表示モード"
      >
        <button
          type="button"
          onClick={onArticle}
          aria-pressed={mode === "article"}
          className={`${base} ${mode === "article" ? on : off}`}
        >
          記事
        </button>
        <button
          type="button"
          onClick={onSlides}
          aria-pressed={mode === "slides"}
          className={`${base} ${mode === "slides" ? on : off}`}
        >
          スライド
        </button>
      </div>
      {mode === "slides" && (
        <p className="hidden font-mono text-[0.68rem] text-fg-subtle sm:block">
          ← → 移動 / F 全画面 / Esc 記事へ
        </p>
      )}
    </div>
  );
}

function SlideControls({
  index,
  total,
  onGo,
  onExit,
}: {
  index: number;
  total: number;
  onGo: (next: number) => void;
  onExit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3">
      <button
        type="button"
        onClick={() => onGo(index - 1)}
        disabled={index === 0}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-fg transition hover:border-accent disabled:opacity-35 disabled:hover:border-border"
      >
        ← 前へ
      </button>

      <ol className="flex flex-1 items-center justify-center gap-1.5" aria-label="スライド一覧">
        {Array.from({ length: total }, (_, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onGo(i)}
              aria-label={`${i + 1}枚目へ`}
              aria-current={i === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-accent" : "w-1.5 bg-border hover:bg-fg-subtle"
              }`}
            />
          </li>
        ))}
      </ol>

      {index === total - 1 ? (
        <button
          type="button"
          onClick={onExit}
          className="rounded-md border border-accent px-3 py-1.5 text-xs font-bold text-accent transition hover:bg-accent-soft"
        >
          記事で見返す
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onGo(index + 1)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-fg transition hover:border-accent"
        >
          次へ →
        </button>
      )}
    </div>
  );
}

function CompleteButton({
  done,
  hydrated,
  onToggle,
}: {
  done: boolean;
  hydrated: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4">
      <button
        type="button"
        onClick={onToggle}
        disabled={!hydrated}
        className={[
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-50",
          done
            ? "bg-ok text-bg"
            : "border border-accent bg-accent text-accent-fg hover:brightness-110",
        ].join(" ")}
      >
        <span aria-hidden>{done ? "✓" : "○"}</span>
        {done ? "学習済み" : "このレッスンを完了にする"}
      </button>
      <p className="text-xs text-fg-subtle">
        進捗はこのブラウザにのみ保存されます (サーバーには送信されません)
      </p>
    </div>
  );
}
