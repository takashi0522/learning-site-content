import { FigureZoom } from "./figure-zoom";
import { FIGURES, type FigureName } from "./figures/registry";

/**
 * MDX 本文に図を置くための部品。`name` は figures/registry.ts の ID。
 *
 * 幅の上限は globals.css の `.figure` で決めている。これは見栄えの都合ではなく、
 * スライドモード (論理 1280px) と記事モードで図の実寸をほぼ揃え、
 * 1 枚 850px の予算を図が食い尽くさないようにするための制約。
 *
 * 各図の SVG は必ず viewBox を持つ。viewBox があれば縦横比が読み込み前に確定するので、
 * slide-stage.tsx の scrollHeight 測定が空振りしない。
 *
 * 本文に収める都合で図の文字は小さくなるため、クリックでの拡大 (FigureZoom) が
 * 読むための主たる手段になる。図を追加するときはここが効くことを前提にしてよい。
 */
export function Figure({
  name,
  caption,
  source,
}: {
  name: FigureName;
  caption?: string;
  source?: string;
}) {
  const Svg = FIGURES[name];
  if (!Svg) {
    // ビルド時に落として、MDX 側の ID の打ち間違いに気づけるようにする。
    throw new Error(`Figure: 未登録の図 "${name}" が参照されました (figures/registry.ts を確認)`);
  }

  return (
    <figure className="figure not-prose my-7">
      <FigureZoom label={caption ?? name}>
        <Svg />
      </FigureZoom>
      {caption || source ? (
        <figcaption className="mt-2 text-center text-xs leading-relaxed text-fg-subtle">
          {caption}
          {source ? <span className="ml-2 opacity-70">出典: {source}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
