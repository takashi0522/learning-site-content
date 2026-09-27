import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "infra学習ノート",
    template: "%s | infra学習ノート",
  },
  description:
    "OS・サーバーハードウェア・ネットワーク・ミドルウェアを、スライドと確認クイズで積み上げる個人用の学習サイト。",
};

/**
 * テーマ適用をハイドレーション前に同期実行する。
 * これを body 描画前に走らせないと、ダーク設定の利用者に一瞬白い画面が出る。
 */
const THEME_SCRIPT = `
try {
  var t = localStorage.getItem('learning-site:theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
        <footer className="mt-16 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-fg-subtle sm:px-6">
            <p>
              個人の学習記録用サイト。教材は自作のノートと、各プロダクトの公式ドキュメント・RFC
              への参照で構成しています。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
