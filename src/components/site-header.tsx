import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/courses/", label: "コース" },
  { href: "/labs/", label: "ラボ" },
  { href: "/resources/", label: "一次情報" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span
            className="inline-flex size-6 items-center justify-center rounded-md bg-fg font-mono text-[0.7rem] text-bg"
            aria-hidden
          >
            /
          </span>
          <span className="text-sm">infra学習ノート</span>
        </Link>

        <nav className="ml-2 flex items-center gap-1 text-xs font-bold" aria-label="メイン">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-fg-muted transition hover:bg-surface hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
