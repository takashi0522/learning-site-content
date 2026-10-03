"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useProgress } from "@/lib/progress";
import { NextLinks } from "./next-links";
import type { Lab } from "@/lib/labs";
import { FabricView } from "./fabric-view";
import { FrameHeaders, Topology } from "./topology";

/**
 * 1 手ずつ「次に何が起きるか」を選んでいく形式。
 *
 * 誤答してもやり直せる。狙いは正誤の採点ではなく、
 * 「自分がどう考えたか」と「実際の仕組み」を突き合わせることなので、
 * 間違えた選択肢には正解を伏せた手がかりだけを出す。
 */
export function WalkLab({ lab }: { lab: Lab }) {
  // 参照が毎回変わると restart の useCallback が作り直されるので固定する
  const steps = useMemo(() => lab.steps ?? [], [lab.steps]);
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState<boolean[]>(() => steps.map(() => false));
  const [picked, setPicked] = useState<number[]>([]);
  const [missed, setMissed] = useState(0);
  const [done, setDone] = useState(false);
  const { recordLab } = useProgress();

  const step = steps[index];
  const isSolved = solved[index];

  const choose = useCallback(
    (optionIndex: number) => {
      if (isSolved) return;
      setPicked((prev) => (prev.includes(optionIndex) ? prev : [...prev, optionIndex]));
      if (step.options[optionIndex].correct) {
        setSolved((prev) => prev.map((v, i) => (i === index ? true : v)));
      } else {
        setMissed((m) => m + 1);
      }
    },
    [index, isSolved, step],
  );

  const goNext = useCallback(() => {
    if (index === steps.length - 1) {
      setDone(true);
      recordLab(lab.id, missed);
      return;
    }
    setIndex((i) => i + 1);
    setPicked([]);
  }, [index, steps.length, recordLab, lab.id, missed]);

  const restart = useCallback(() => {
    setIndex(0);
    setSolved(steps.map(() => false));
    setPicked([]);
    setMissed(0);
    setDone(false);
  }, [steps]);

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-accent bg-accent-soft px-6 py-5">
          <p className="text-sm font-bold text-fg">完走しました</p>
          <p className="mt-1 text-sm text-fg-muted">
            {missed === 0
              ? "全問を一度で選べています。経路の判断が身についています。"
              : `途中で ${missed} 回、別の選択肢を選びました。迷ったところが、いま曖昧な部分です。`}
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-surface px-6 py-5">
          <h2 className="mb-3 text-sm font-bold text-fg">このラボで確かめたこと</h2>
          <ul className="flex flex-col gap-2">
            {(lab.summary ?? []).map((line) => (
              <li key={line} className="flex gap-2 text-sm leading-relaxed text-fg-muted">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <NextLinks items={lab.next} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-fg transition hover:border-accent"
          >
            もう一度やる
          </button>
          <Link
            href="/labs/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-accent hover:text-fg"
          >
            ラボ一覧へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {lab.intro ? (
        <details className="rounded-2xl border border-border bg-surface-2 px-5 py-4" open={index === 0}>
          <summary className="cursor-pointer text-sm font-bold text-fg">{lab.intro.title}</summary>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {lab.intro.body.map((line) => (
              <p key={line} className="text-sm leading-relaxed text-fg-muted">
                {line}
              </p>
            ))}
          </div>
        </details>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface px-4 py-4 sm:px-6">
        {/* links を持つラボは段になったファブリック、持たないラボは直線トポロジ */}
        {lab.links?.length ? (
          <FabricView
            nodes={lab.nodes ?? []}
            links={lab.links}
            at={step.at}
            path={step.path}
            down={step.down}
            rowLabels={lab.rowLabels}
          />
        ) : (
          <Topology nodes={lab.nodes ?? []} segments={lab.segments ?? []} at={step.at} />
        )}
      </section>

      {lab.macs ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-fg-subtle">いま線の上を流れているもの</h2>
          <FrameHeaders frame={step.frame} changed={step.changed} macs={lab.macs} />
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface px-6 py-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="font-mono text-xs text-fg-subtle">
            {index + 1} / {steps.length}
          </p>
          <ol className="flex items-center gap-1.5" aria-label="進行状況">
            {steps.map((s, i) => (
              <li
                key={s.id}
                aria-current={i === index ? "step" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-accent" : solved[i] ? "w-1.5 bg-ok" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </ol>
        </div>

        {step.code ? (
          <pre className="mb-4 overflow-x-auto rounded-xl border border-border bg-surface-2 px-4 py-3 font-mono text-xs leading-relaxed text-fg">
            {step.code}
          </pre>
        ) : null}

        <p className="text-base font-bold leading-relaxed text-fg">{step.prompt}</p>

        <ul className="mt-4 flex flex-col gap-2">
          {step.options.map((option, i) => {
            const chosen = picked.includes(i);
            const correct = Boolean(option.correct);
            const showAsCorrect = isSolved && correct;
            const showAsWrong = chosen && !correct;
            return (
              <li key={option.label}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  disabled={isSolved || showAsWrong}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-left text-sm leading-relaxed transition",
                    showAsCorrect
                      ? "border-ok bg-ok/10 font-bold text-fg"
                      : showAsWrong
                        ? "border-ng bg-ng/8 text-fg-muted"
                        : isSolved
                          ? "border-border text-fg-subtle"
                          : "border-border text-fg hover:border-accent hover:bg-accent-soft",
                  ].join(" ")}
                >
                  {option.label}
                </button>
                {showAsWrong ? (
                  <p className="mt-1.5 pl-4 text-xs leading-relaxed text-ng">{option.hint}</p>
                ) : null}
              </li>
            );
          })}
        </ul>

        {isSolved ? (
          <div className="mt-5 rounded-xl border border-border bg-surface-2 px-4 py-4">
            <p className="mb-1.5 text-xs font-bold text-accent">なぜそうなるか</p>
            <p className="text-sm leading-relaxed text-fg-muted">{step.explain}</p>
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setPicked([]);
          }}
          disabled={index === 0}
          className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-fg transition hover:border-accent disabled:opacity-35 disabled:hover:border-border"
        >
          ← 戻る
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!isSolved}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-accent-fg transition hover:brightness-110 disabled:opacity-35"
        >
          {index === steps.length - 1 ? "結果を見る" : "次へ →"}
        </button>
      </div>
    </div>
  );
}
