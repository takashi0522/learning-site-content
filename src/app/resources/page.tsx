import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "一次情報",
  description: "OS・ネットワーク・ハードウェア・ミドルウェアの仕様と公式ドキュメントへの入口。",
};

type ResourceLink = { label: string; url: string; note?: string };
type ResourceGroup = {
  id: string;
  title: string;
  description: string;
  links: ResourceLink[];
};

function loadGroups(): ResourceGroup[] {
  const file = path.join(process.cwd(), "content", "resources.json");
  if (!fs.existsSync(file)) return [];
  return (JSON.parse(fs.readFileSync(file, "utf8")).groups ?? []) as ResourceGroup[];
}

export default function ResourcesPage() {
  const groups = loadGroups();

  return (
    <div className="flex flex-col gap-10">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">一次情報</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">
          教材はあくまで理解の足場です。実際に設定値を決めるときや、挙動の根拠が必要なときは、
          ここから仕様と公式ドキュメントに当たってください。
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.id}>
          <h2 className="text-lg font-bold tracking-tight">{group.title}</h2>
          <p className="mt-1 mb-4 text-sm leading-relaxed text-fg-muted">{group.description}</p>

          <ul className="grid gap-3 sm:grid-cols-2">
            {group.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-full flex-col gap-1.5 rounded-xl border border-border bg-surface px-5 py-4 transition hover:border-accent"
                >
                  <span className="text-sm font-bold">{link.label}</span>
                  {link.note && (
                    <span className="text-xs leading-relaxed text-fg-muted">{link.note}</span>
                  )}
                  <span className="mt-auto truncate pt-1 font-mono text-[0.65rem] text-fg-subtle">
                    {new URL(link.url).hostname}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
