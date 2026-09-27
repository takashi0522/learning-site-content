"use client";

import { useState } from "react";

type VideoEmbedProps = {
  /** YouTube の動画 ID (URL の v= のあと) */
  id: string;
  title: string;
  /** 出典として表示する配信元 */
  channel?: string;
};

/**
 * クリックされるまで YouTube への通信を一切行わないファサード方式の埋め込み。
 * ページを開いただけで第三者に閲覧履歴が飛ぶのを避ける意図で、
 * 再生時も youtube-nocookie.com を使う。
 */
export function VideoEmbed({ id, title, channel }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="not-prose my-8">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface-2">
        {playing ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex size-full flex-col items-center justify-center gap-3 p-6 text-center transition hover:bg-surface"
          >
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-accent text-accent-fg transition group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="ml-0.5 size-6" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="text-sm font-bold text-fg">{title}</span>
            <span className="text-xs text-fg-subtle">
              クリックで YouTube から読み込みます{channel ? ` · ${channel}` : ""}
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 text-xs text-fg-subtle">
        出典: {channel ? `${channel} — ` : ""}
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2"
        >
          YouTube で開く
        </a>
      </figcaption>
    </figure>
  );
}
