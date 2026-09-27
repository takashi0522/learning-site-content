"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * スライドを 16:9 の固定枠に収める。
 *
 * 中身は「論理幅 1280px」のキャンバス上に組み、実寸への変換は transform: scale()
 * で行う (reveal.js などと同じ方式)。画面サイズが変わってもレイアウトが崩れず、
 * 1 画面に収まる。
 *
 * 枠の寸法は CSS ではなく JS で決めてインラインで当てる。CSS 側に aspect-ratio や
 * max-width を持たせると「状態が変わる → 枠の寸法が変わる → 測り直し」という
 * 相互作用が起きて、測定値が安定しないため。
 */
const LOGICAL_WIDTH = 1280;
const ASPECT = 16 / 9;
/** これ以上縮めると本文が読めなくなる下限 (論理 18px → 実寸 約 12px) */
const MIN_SCALE = 0.67;
/** この幅を下回る画面では 16:9 に押し込めないので、通常の縦スクロール表示に切り替える */
const FLOW_BREAKPOINT = 720;
/** スライド枠の下に残す余白 */
const PAGE_MARGIN = 32;
const PAGE_MARGIN_FULLSCREEN = 16;

type Layout =
  | { mode: "flow" }
  | { mode: "fit"; width: number; height: number; scale: number; contentHeight: number };

export function SlideStage({ children }: { children: ReactNode }) {
  // 幅の基準。この要素の寸法は fit/flow のどちらでも変わらないので、測定が安定する
  const outerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const content = contentRef.current;
    if (!outer || !content) return;

    const measure = () => {
      const availableWidth = outer.clientWidth;
      if (availableWidth === 0) return;

      if (availableWidth < FLOW_BREAKPOINT) {
        setLayout({ mode: "flow" });
        return;
      }

      // 枠の外で使われている高さを実測する。固定値で見積もるとずれるため。
      //   ・スライド自身のヘッダと操作列
      //   ・ページ上部 (サイトヘッダ、モード切替) がスライドより上で使っている分
      const view = outer.closest(".slide-view");
      const fullscreen = Boolean(document.fullscreenElement);
      let chrome = 16; // 枠線ぶん
      let viewTop = 0;
      if (view) {
        for (const child of Array.from(view.children)) {
          if (!child.contains(outer)) chrome += child.getBoundingClientRect().height;
        }
        // スクロール位置に依存しないよう、文書先頭からの位置で測る
        // (スライドに入るとページ先頭へ戻すので、これが実際の表示位置になる)
        if (!fullscreen) viewTop = view.getBoundingClientRect().top + window.scrollY;
      }

      const margin = fullscreen ? PAGE_MARGIN_FULLSCREEN : PAGE_MARGIN;
      const availableHeight = Math.max(320, window.innerHeight - viewTop - chrome - margin);

      // 幅と高さの両方に収まる 16:9 の枠
      const width = Math.min(availableWidth, availableHeight * ASPECT);
      const height = width / ASPECT;

      // transform はレイアウトに影響しないので、常に等倍 (論理幅) での高さが得られる
      const contentHeight = content.scrollHeight;
      if (contentHeight === 0) return;

      const widthScale = width / LOGICAL_WIDTH;
      const heightScale = height / contentHeight;
      // 幅にも高さにも収まる倍率。ただし読める下限より小さくはしない
      const scale = Math.max(Math.min(widthScale, heightScale), Math.min(widthScale, MIN_SCALE));

      setLayout({ mode: "fit", width, height, scale, contentHeight });
    };

    // 初回の測定。フォント適用前の値を拾うことがあるので 2 フレームに分ける。
    const frameId = requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure);
    });

    // 非表示タブでは requestAnimationFrame も ResizeObserver も発火しないため、
    // タイマーでも測っておく。表示に戻ったときは visibilitychange で測り直す。
    const timers = [setTimeout(measure, 0), setTimeout(measure, 150)];
    const onVisible = () => {
      if (!document.hidden) measure();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(content);
    window.addEventListener("resize", measure);
    document.addEventListener("fullscreenchange", measure);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelAnimationFrame(frameId);
      timers.forEach(clearTimeout);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("fullscreenchange", measure);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const isFit = layout?.mode === "fit";
  const overflowing = isFit && layout.contentHeight * layout.scale > layout.height + 1;

  return (
    <div ref={outerRef} className="slide-outer">
      <div
        data-slide-frame={layout?.mode ?? "measuring"}
        data-overflowing={overflowing ? "true" : undefined}
        className={[
          "slide-frame flex justify-center",
          layout?.mode === "flow"
            ? "overflow-y-auto px-5 py-6"
            : overflowing
              ? "items-start overflow-y-auto"
              : "items-center overflow-hidden",
        ].join(" ")}
        style={isFit ? { width: layout.width, height: layout.height } : undefined}
      >
        {/* 縮小後の実寸を持つ箱。これがあることで flex の中央寄せが効く */}
        <div
          style={
            isFit
              ? {
                  width: LOGICAL_WIDTH * layout.scale,
                  height: layout.contentHeight * layout.scale,
                  flexShrink: 0,
                }
              : undefined
          }
        >
          {/* 測定が終わるまでも論理幅で組んでおく (flow から fit へ跳ねるのを防ぐ) */}
          <div
            ref={contentRef}
            className="slide-canvas"
            style={
              layout?.mode === "flow"
                ? undefined
                : {
                    width: LOGICAL_WIDTH,
                    transform: isFit ? `scale(${layout.scale})` : undefined,
                    transformOrigin: "top left",
                  }
            }
          >
            <article className="prose">{children}</article>
          </div>
        </div>
      </div>
    </div>
  );
}
