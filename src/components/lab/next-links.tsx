import Link from "next/link";

/**
 * ラボの最後に出す「仕組みを読む」リンク。
 * 一次情報 (ベンダーのリファレンスアーキテクチャなど) を並べることがあるので、
 * 外部 URL は別タブで開く。内部リンクは next/link のまま。
 */
export function NextLinks({ items }: { items?: { label: string; href: string }[] }) {
  if (!items?.length) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface px-6 py-5">
      <h2 className="mb-3 text-sm font-bold text-fg">仕組みを読む</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const external = /^https?:\/\//.test(item.href);
          return (
            <li key={item.href}>
              {external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-accent underline"
                >
                  {item.label}
                  <span className="ml-1 text-[0.65rem] opacity-70" aria-label="外部サイト">
                    ↗
                  </span>
                </a>
              ) : (
                <Link href={item.href} className="text-sm text-accent underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
