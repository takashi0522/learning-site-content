"use client";

import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "learning-site:theme";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "OS設定", light: "ライト", dark: "ダーク" };
const ICON: Record<Theme, string> = { system: "◐", light: "☀", dark: "☾" };

// 進捗ストアと同じ方針: React の外に状態を置き、useSyncExternalStore で購読する。
const listeners = new Set<() => void>();
let cached: Theme | null = null;

function readTheme(): Theme {
  if (cached !== null) return cached;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    cached = saved && ORDER.includes(saved) ? saved : "system";
  } catch {
    cached = "system";
  }
  return cached;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function setTheme(theme: Theme) {
  cached = theme;
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ストレージが使えなくても切り替え自体は機能させる */
  }
  listeners.forEach((listener) => listener());
}

/**
 * 初回描画時のちらつきは layout.tsx の同期スクリプトが防いでいる。
 * ここはその結果を読み取って切り替えるだけ。
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

  return (
    <button
      type="button"
      onClick={() => setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length])}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-fg-muted transition hover:border-accent hover:text-fg"
      title={`表示テーマ: ${LABEL[theme]}`}
      aria-label={`表示テーマを切り替える (現在: ${LABEL[theme]})`}
    >
      <span aria-hidden>{ICON[theme]}</span>
      <span className="hidden sm:inline">{LABEL[theme]}</span>
    </button>
  );
}
