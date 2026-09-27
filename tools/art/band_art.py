# -*- coding: utf-8 -*-
"""レッスン冒頭の帯。**帯の比率で作る。**

カード用の 640x360 を高さ 104px の帯で cover すると、画像の 1 割ほどしか映らず
何が描かれているのか分からなくなる。帯は帯として、横長の構図で生成し直す。

生成は 1344x384 (3.5:1)。SDXL は極端な縦横比で構図が壊れるので、ここで止めて
後から帯の比率へ中央で切る。表示側と比率が一致するので、ブラウザ側では切れない。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageEnhance, ImageFilter  # noqa: E402

import comfy  # noqa: E402
from course_art import COURSES, NEG  # noqa: E402

# 帯は横長なので、構図もそう指示する
BASE = (
    "no humans, abstract minimal background, wide panoramic composition, horizontal banner, "
    "flat geometric shapes, monochrome, greyscale, soft gradient, calm, quiet, "
    "simple composition, lots of empty space, soft focus, subtle"
)

GEN_W, GEN_H = 1344, 384
OUT_W, OUT_H = 1344, 262  # 表示側の 768x150 と同じ 5.12:1

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_raw", "band")
FINAL = "public/course-band"


def postprocess(src, dst):
    im = Image.open(src).convert("L")
    top = (im.height - OUT_H) // 2
    im = im.crop((0, top, im.width, top + OUT_H))  # 中央で帯の比率に切る
    im = im.filter(ImageFilter.GaussianBlur(0.7))
    im = ImageEnhance.Contrast(im).enhance(0.75)
    im.save(dst, quality=80, optimize=True)
    return os.path.getsize(dst)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(FINAL, exist_ok=True)
    for i, (cid, motif) in enumerate(COURSES.items()):
        raw = os.path.join(OUT, cid + ".png")
        if not os.path.exists(raw):
            comfy.run(raw, 5200 + i * 173, motif + ", " + BASE, NEG, width=GEN_W, height=GEN_H)
        size = postprocess(raw, os.path.join(FINAL, cid + ".jpg"))
        print("%-12s %6.1f KB" % (cid, size / 1024))
