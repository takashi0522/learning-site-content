/**
 * サイトを置くパスの前置き。自宅サーバーでは空、GitHub Pages では "/learning-site-content"。
 * next/link と next.config の basePath はこれを自動で足すが、生の <a>・CSS の url()・fetch には
 * 効かないので、ルートからのパスはここを通す。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBase(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? BASE_PATH + path : path;
}
