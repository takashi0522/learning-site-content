"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "@/lib/search-index";

const MAX_RESULTS = 30;
/** 1 つのレッスンから出す節の上限。長いレッスンが結果を占領しないようにする */
const MAX_PER_LESSON = 3;

/** 全角英数を半角に寄せ、大文字小文字を区別しない */
function normalize(s: string): string {
  return s.normalize("NFKC").toLowerCase();
}

type Hit = { entry: SearchEntry; score: number; snippet: string };

/**
 * 日本語は単語に区切りにくいので、空白で区切った語の部分一致 (AND) で探す。
 * どこに当たったかで重みを変える: レッスン名 > 見出し > 説明・タグ > 本文。
 */
function search(index: SearchEntry[], query: string): Hit[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: Hit[] = [];
  for (const entry of index) {
    const title = normalize(`${entry.courseTitle} ${entry.lessonTitle}`);
    const heading = normalize(entry.heading);
    const meta = normalize(entry.meta);
    const text = normalize(entry.text);

    let score = 0;
    let matchedAll = true;
    for (const term of terms) {
      const s =
        (title.includes(term) ? 10 : 0) +
        (heading.includes(term) ? 6 : 0) +
        (meta.includes(term) ? 3 : 0) +
        (text.includes(term) ? 1 : 0);
      if (s === 0) {
        matchedAll = false;
        break;
      }
      score += s;
    }
    if (!matchedAll) continue;

    hits.push({ entry, score, snippet: makeSnippet(entry.text, text, terms[0]) });
  }

  hits.sort((a, b) => b.score - a.score);

  const perLesson = new Map<string, number>();
  const out: Hit[] = [];
  for (const hit of hits) {
    const lesson = hit.entry.href.split("#")[0];
    const n = perLesson.get(lesson) ?? 0;
    if (n >= MAX_PER_LESSON) continue;
    perLesson.set(lesson, n + 1);
    out.push(hit);
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

/** 最初に当たった語の前後を切り出す。normalize は文字数を変えうるので、位置は目安として使う */
function makeSnippet(original: string, normalized: string, term: string): string {
  const at = normalized.indexOf(term);
  if (at < 0) return original.slice(0, 90);
  const start = Math.max(0, at - 30);
  return (start > 0 ? "…" : "") + original.slice(start, start + 100) + "…";
}

export function SiteSearch() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const loading = useRef(false);

  const results = useMemo(() => (index ? search(index, query) : []), [index, query]);

  /** 索引は初めて開いたときに読む。トップページの読み込みを重くしないため */
  function open() {
    dialogRef.current?.showModal();
    inputRef.current?.select();
    if (index || loading.current) return;
    loading.current = true;
    fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: SearchEntry[]) => setIndex(data))
      .catch(() => setFailed(true))
      .finally(() => {
        loading.current = false;
      });
  }

  // Ctrl+K / ⌘K で開く。ページ側のキー操作 (スライド送り) と衝突しない組み合わせ
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].entry.href);
    }
  }

  function go(href: string) {
    dialogRef.current?.close();
    window.location.href = href;
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-fg-muted transition hover:border-accent hover:text-fg"
        aria-label="サイト内を検索"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">検索</span>
        <kbd className="hidden rounded border border-border px-1 font-mono text-[0.6rem] text-fg-subtle sm:inline">
          Ctrl K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        className="search-dialog"
        aria-label="サイト内検索"
        onClick={(event) => {
          // 枠の外 (::backdrop) をクリックしたら閉じる
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        // Escape は <dialog> が自前で閉じる。ページ側 (スライド操作) へは流さない
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="search-dialog-inner">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="レッスン名・見出し・本文から探す（空白区切りで AND）"
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-fg-subtle"
            aria-label="検索語"
          />

          <div className="search-dialog-results" role="listbox" aria-label="検索結果">
            {failed && <p className="px-4 py-6 text-sm text-fg-muted">索引を読み込めませんでした。</p>}
            {!failed && !index && <p className="px-4 py-6 text-sm text-fg-muted">索引を読み込んでいます…</p>}
            {index && query.trim() && results.length === 0 && (
              <p className="px-4 py-6 text-sm text-fg-muted">見つかりませんでした。</p>
            )}
            {results.map((hit, i) => (
              <a
                key={hit.entry.href + i}
                href={hit.entry.href}
                role="option"
                aria-selected={i === active}
                data-accent={hit.entry.accent}
                onMouseEnter={() => setActive(i)}
                onClick={(event) => {
                  event.preventDefault();
                  go(hit.entry.href);
                }}
                className={`block border-b border-border px-4 py-3 ${i === active ? "bg-surface-2" : ""}`}
              >
                <p className="font-mono text-[0.65rem] font-bold tracking-wider text-accent">
                  {hit.entry.courseTitle}
                </p>
                <p className="text-sm font-bold">
                  {hit.entry.lessonTitle}
                  {hit.entry.heading && <span className="font-normal text-fg-muted"> › {hit.entry.heading}</span>}
                </p>
                {hit.snippet && <p className="mt-1 line-clamp-2 text-xs text-fg-subtle">{hit.snippet}</p>}
              </a>
            ))}
          </div>

          <p className="border-t border-border px-4 py-2 font-mono text-[0.65rem] text-fg-subtle">
            ↑↓ で選択 / Enter で開く / Esc で閉じる
          </p>
        </div>
      </dialog>
    </>
  );
}
