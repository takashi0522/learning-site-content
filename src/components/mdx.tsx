import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkCjkFriendly from "remark-cjk-friendly";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import type { AnchorHTMLAttributes } from "react";
import { Quiz } from "./quiz";
import { Callout } from "./callout";
import { VideoEmbed } from "./video-embed";
import { Figure } from "./figure";
import { withBase } from "@/lib/base-path";

const prettyCodeOptions: PrettyCodeOptions = {
  // 明暗 2 テーマを同時に出力し、CSS 変数側で切り替える (globals.css を参照)
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
  defaultLang: "text",
};

function Anchor({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={withBase(href)}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      {...props}
    />
  );
}

/** MDX 本文から呼べる部品。ここに登録したものだけが教材内で使える。 */
const components = {
  Quiz,
  Callout,
  VideoEmbed,
  Figure,
  a: Anchor,
};

/**
 * MDX をビルド時にコンパイルして描画するサーバーコンポーネント。
 * 記事モードもスライド 1 枚も、同じこの関数を通る。
 */
export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          // CommonMark の強調規則は「は**強調**に」のように前後が日本語文字だと
          // ** を開けない。remark-cjk-friendly がその判定を CJK 向けに緩める。
          remarkPlugins: [remarkGfm, remarkCjkFriendly],
          rehypePlugins: [rehypeSlug, [rehypePrettyCode, prettyCodeOptions]],
        },
      }}
    />
  );
}
