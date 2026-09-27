# -*- coding: utf-8 -*-
"""コースカードの背景画を 11 枚まとめて作る。

出力は **グレースケール**。色付けは CSS 側で background-blend-mode: luminosity と
var(--accent) にやらせるので、ここで色を焼き付けない。そうすればファイルは 1 枚で
ライト/ダークとコース別アクセントの両方に追従する (図を C 経由で書いているのと同じ理屈)。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageEnhance, ImageFilter  # noqa: E402

import comfy  # noqa: E402

# 画風は全コース共通。ここを揃えないと 11 枚がバラける
BASE = (
    "no humans, abstract minimal background, flat geometric shapes, monochrome, greyscale, "
    "soft gradient, calm, quiet, simple composition, lots of empty space, soft focus, subtle"
)
NEG = (
    "text, watermark, signature, logo, letters, numbers, 1girl, 1boy, person, face, character, "
    "colorful, saturated, vivid, cluttered, busy, noisy, ui, interface, photo, realistic"
)

# モチーフはコースごとに変える。カードを見分ける手がかりにもなる
COURSES = {
    "linux": "layered horizontal strata, nested concentric layers, cross section",
    "ops": "rhythmic vertical bars, repeating blocks, staircase of platforms",
    "hardware": "geometric circuit grid, rectangular chips, orthogonal traces",
    "gpu": "dense grid of small squares, tiled array, repeating lattice",
    "network": "thin connecting lines, sparse nodes, constellation web",
    "facility": "rows of tall rectangular columns receding, corridor, perspective",
    "ai": "flowing streams of particles, soft curves converging",
    "gpunet": "parallel rails converging into the distance, long straight lanes",
    "buildout": "scaffolding frame, stacked platforms, blueprint planes",
    "middleware": "interlocking pipes, tubes, conduits, layered connections",
    "auth": "interlocking rings, concentric circles, geometric lock shape",
}

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_raw", "course")
FINAL = "public/course-art"


def postprocess(src, dst):
    im = Image.open(src).convert("L")  # グレースケール。JPEG も小さくなる
    im = im.resize((640, 360), Image.LANCZOS)
    im = im.filter(ImageFilter.GaussianBlur(0.8))
    # 装飾なので強い明暗は邪魔。コントラストを寝かせる
    im = ImageEnhance.Contrast(im).enhance(0.72)
    im.save(dst, quality=78, optimize=True)
    return os.path.getsize(dst)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(FINAL, exist_ok=True)
    for i, (cid, motif) in enumerate(COURSES.items()):
        raw = os.path.join(OUT, cid + ".png")
        if not os.path.exists(raw):
            comfy.run(raw, 7000 + i * 137, motif + ", " + BASE, NEG)
        size = postprocess(raw, os.path.join(FINAL, cid + ".jpg"))
        print("%-12s %6.1f KB" % (cid, size / 1024))
