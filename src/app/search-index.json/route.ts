import { buildSearchIndex } from "@/lib/search-index";

// 静的エクスポートでは、ビルド時に 1 回だけ実行されて out/search-index.json になる
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex());
}
