# -*- coding: utf-8 -*-
"""ラボカードの背景画。course_art.py と同じ作り (グレースケールで出して色は CSS 側)。"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comfy  # noqa: E402
from course_art import BASE, NEG, postprocess  # noqa: E402

LABS = {
    "packet-walk": "a single thin line travelling through layered gates, sequential checkpoints",
    "fabric-walk": "two tier network of nodes, upper row and lower row linked by many thin lines",
    "gpu-network": "four parallel channels running side by side, separated lanes",
    "rack-design": "tall narrow frame divided into many equal horizontal slots",
    "rack-gpu": "tall frame with dense heavy blocks stacked in the lower half",
    "rack-cabling": "bundles of long cables sweeping downward, curved strands",
    "gpu-placement": "grid of cells with a few cells highlighted, sparse placement",
    "pytorch-training": "a looping conveyor of small identical blocks feeding into a dense machine and back",
}

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_raw", "lab")
FINAL = "public/lab-art"

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(FINAL, exist_ok=True)
    for i, (lid, motif) in enumerate(LABS.items()):
        raw = os.path.join(OUT, lid + ".png")
        if not os.path.exists(raw):
            comfy.run(raw, 3100 + i * 211, motif + ", " + BASE, NEG)
        size = postprocess(raw, os.path.join(FINAL, lid + ".jpg"))
        print("%-16s %6.1f KB" % (lid, size / 1024))
