"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * 学習進捗はすべてブラウザの localStorage に閉じる。
 * アカウントもサーバーも持たないので、静的ホスティングのまま公開できる。
 * 端末をまたいだ同期が必要になったら、この 1 ファイルだけを差し替える。
 *
 * React 側からは useSyncExternalStore で購読する。
 * useEffect で localStorage を読んで setState する書き方に比べ、
 * サーバー描画時のスナップショットを明示できるためハイドレーション不一致が起きない。
 */
const STORAGE_KEY = "learning-site:progress:v2";
/** v1 には labs が無い。初回だけ読み替えて引き継ぐ。 */
const LEGACY_KEY = "learning-site:progress:v1";

export type QuizResult = {
  /** 最終的に正解したか */
  correct: boolean;
  /** 正解までに選んだ回数 */
  attempts: number;
  at: number;
};

export type LabResult = {
  /** 最後まで到達した時刻 */
  at: number;
  /** 誤答を選んだ回数。少ないほど自力で辿れている */
  missed: number;
};

export type ProgressState = {
  /** lessonKey (`courseId/slug`) -> 完了時刻 */
  completed: Record<string, number>;
  /** `lessonKey#quizId` -> 解答結果 */
  quiz: Record<string, QuizResult>;
  /** lessonKey -> 最後に開いたスライド番号 */
  lastSlide: Record<string, number>;
  /** labId -> 完走の記録 */
  labs: Record<string, LabResult>;
};

const EMPTY: ProgressState = Object.freeze({ completed: {}, quiz: {}, lastSlide: {}, labs: {} });

// ---- ストア本体 (React の外側) ---------------------------------------

let snapshot: ProgressState | null = null;
const listeners = new Set<() => void>();

function readStorage(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      completed: parsed.completed ?? {},
      quiz: parsed.quiz ?? {},
      lastSlide: parsed.lastSlide ?? {},
      labs: parsed.labs ?? {},
    };
  } catch {
    // プライベートウィンドウなどストレージが使えない環境ではメモリ上だけで動かす
    return EMPTY;
  }
}

function getSnapshot(): ProgressState {
  if (snapshot === null) snapshot = readStorage();
  return snapshot;
}

/** サーバー描画と初回ハイドレーションで使う値。必ず同じ参照を返す。 */
function getServerSnapshot(): ProgressState {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // 別タブでの学習も同じ端末なら反映させる
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = readStorage();
    listeners.forEach((listener) => listener());
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function mutate(update: (prev: ProgressState) => ProgressState) {
  const next = update(getSnapshot());
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 保存できなくても学習の妨げにはしない */
  }
  listeners.forEach((listener) => listener());
}

// ---- React からの入口 -------------------------------------------------

/**
 * localStorage を読んだ後の描画かどうか。
 * サーバー側では常に false を返すので、進捗 UI を出すかどうかの判定に使える。
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useIsHydrated();

  const setCompleted = useCallback((lessonKey: string, done: boolean) => {
    mutate((prev) => {
      const completed = { ...prev.completed };
      if (done) completed[lessonKey] = Date.now();
      else delete completed[lessonKey];
      return { ...prev, completed };
    });
  }, []);

  const recordQuiz = useCallback((quizKey: string, correct: boolean, attempts: number) => {
    mutate((prev) => ({
      ...prev,
      quiz: { ...prev.quiz, [quizKey]: { correct, attempts, at: Date.now() } },
    }));
  }, []);

  const rememberSlide = useCallback((lessonKey: string, index: number) => {
    mutate((prev) => ({ ...prev, lastSlide: { ...prev.lastSlide, [lessonKey]: index } }));
  }, []);

  const recordLab = useCallback((labId: string, missed: number) => {
    mutate((prev) => ({ ...prev, labs: { ...prev.labs, [labId]: { at: Date.now(), missed } } }));
  }, []);

  const resetAll = useCallback(() => mutate(() => EMPTY), []);

  return { state, hydrated, setCompleted, recordQuiz, rememberSlide, recordLab, resetAll };
}

/** コース単位の到達率。ダッシュボードとコース一覧の両方で使う。 */
export function useCourseProgress(lessonKeys: string[]) {
  const { state, hydrated } = useProgress();
  const done = lessonKeys.filter((key) => Boolean(state.completed[key])).length;
  return { hydrated, done, total: lessonKeys.length };
}
