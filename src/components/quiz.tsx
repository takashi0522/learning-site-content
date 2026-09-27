"use client";

import { useState } from "react";
import { useProgress } from "@/lib/progress";
import { useLessonIdentity } from "./lesson-context";

type QuizProps = {
  /** レッスン内で一意なら何でもよい。localStorage のキーになるので後から変えない。 */
  id: string;
  question: string;
  options: string[];
  /** 正解の選択肢の 0 始まりインデックス */
  answer: number;
  explanation: string;
};

/**
 * MDX 本文にそのまま置ける確認クイズ。
 * 解答結果はレッスン単位で保存され、ダッシュボードの一発正解数に反映される。
 */
export function Quiz({ id, question, options, answer, explanation }: QuizProps) {
  const { lessonKey } = useLessonIdentity();
  const { state, recordQuiz } = useProgress();
  const quizKey = `${lessonKey}#${id}`;

  const [attempt, setAttempt] = useState<{ selected: number; count: number } | null>(null);

  // 過去に正解済みならストアの値を正として復元する (effect を使わず描画時に解決する)
  const saved = state.quiz[quizKey];
  const current =
    attempt ?? (saved?.correct ? { selected: answer, count: saved.attempts } : null);

  const answered = current !== null;
  const isCorrect = answered && current.selected === answer;

  function choose(index: number) {
    if (isCorrect) return; // 正解後は固定
    const count = (current?.count ?? 0) + 1;
    setAttempt({ selected: index, count });
    if (index === answer) recordQuiz(quizKey, true, count);
  }

  return (
    <section
      className="not-prose my-8 rounded-xl border border-border bg-surface p-5"
      aria-labelledby={`quiz-${id}`}
    >
      <p className="mb-1 font-mono text-[0.68rem] font-bold tracking-widest text-accent uppercase">
        確認クイズ
      </p>
      <h4 id={`quiz-${id}`} className="mb-4 text-base leading-relaxed font-bold text-fg">
        {question}
      </h4>

      <ul className="flex flex-col gap-2">
        {options.map((option, index) => {
          const chosen = current?.selected === index;
          const revealCorrect = answered && index === answer;
          const revealWrong = chosen && !isCorrect;

          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => choose(index)}
                disabled={isCorrect}
                aria-pressed={chosen}
                className={[
                  "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition",
                  "disabled:cursor-default",
                  revealCorrect
                    ? "border-ok bg-ok/10 text-fg"
                    : revealWrong
                      ? "border-ng bg-ng/10 text-fg"
                      : "border-border bg-surface-2 text-fg hover:border-accent",
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[0.65rem] font-bold",
                    revealCorrect
                      ? "border-ok text-ok"
                      : revealWrong
                        ? "border-ng text-ng"
                        : "border-fg-subtle text-fg-subtle",
                  ].join(" ")}
                  aria-hidden
                >
                  {revealCorrect ? "✓" : revealWrong ? "×" : String.fromCharCode(65 + index)}
                </span>
                <span className="leading-relaxed">{option}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm leading-relaxed"
        >
          <p className={`mb-1 font-bold ${isCorrect ? "text-ok" : "text-ng"}`}>
            {isCorrect ? `正解 (${current.count}回目)` : "不正解 — もう一度選んでみてください"}
          </p>
          {isCorrect && <p className="text-fg-muted">{explanation}</p>}
        </div>
      )}
    </section>
  );
}
