"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** 「枠に収める」を 1 倍として、その何倍まで拡げられるか。 */
const STEPS = [1, 1.5, 2, 3] as const;

/**
 * 図をクリックで拡大表示する。
 *
 * ネイティブの `<dialog open>` (トップレイヤー) を使うのが肝で、
 * スライドモードの `transform: scale()` の影響を受けずに実寸で描ける。
 * つまり 12px まで縮んだスライド上の図でも、開けば画面いっぱいで読める。
 *
 * 閉じている間は中身を描かない。同じ SVG が 2 つ DOM に乗るのを避けるため。
 */
export function FigureZoom({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const zoom = useCallback((delta: number) => {
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + delta)));
  }, []);

  function onKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoom(1);
    } else if (event.key === "-") {
      event.preventDefault();
      zoom(-1);
    } else if (event.key === "0") {
      event.preventDefault();
      setStep(0);
    }
    // Escape は <dialog> が自前で閉じる。ここで拾うとスライドモードまで抜けてしまう。
    event.stopPropagation();
  }

  return (
    <>
      <button
        type="button"
        className="figure-trigger"
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        aria-label={`${label}を拡大表示する`}
      >
        {children}
        <span className="figure-trigger-hint" aria-hidden>
          クリックで拡大
        </span>
      </button>

      <dialog
        ref={ref}
        className="figure-dialog"
        onClose={() => setOpen(false)}
        onKeyDown={onKeyDown}
        onClick={(event) => {
          // 背景 (dialog 自身) を押したときだけ閉じる
          if (event.target === ref.current) setOpen(false);
        }}
      >
        {open ? (
          <div className="figure-dialog-inner">
            <div className="figure-dialog-bar">
              <p className="figure-dialog-label">{label}</p>
              <div className="figure-dialog-tools">
                <button
                  type="button"
                  onClick={() => zoom(-1)}
                  disabled={step === 0}
                  aria-label="縮小"
                >
                  −
                </button>
                <span className="figure-dialog-ratio">{STEPS[step]}×</span>
                <button
                  type="button"
                  onClick={() => zoom(1)}
                  disabled={step === STEPS.length - 1}
                  aria-label="拡大"
                >
                  ＋
                </button>
                <button type="button" onClick={() => setOpen(false)} className="figure-dialog-close">
                  閉じる
                </button>
              </div>
            </div>

            <div className="figure-dialog-scroll">
              <div style={{ width: `${STEPS[step] * 100}%` }}>{children}</div>
            </div>

            <p className="figure-dialog-help">＋ − で拡大縮小 / 0 で等倍 / Esc で閉じる</p>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
