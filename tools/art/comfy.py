# -*- coding: utf-8 -*-
"""ComfyUI の HTTP API に txt2img を投げて、出来た画像を保存するだけの小さな道具。

使い方:  python comfy.py <出力ファイル名> <seed> "<positive>" "<negative>"
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

HOST = "http://127.0.0.1:8188"
CKPT = "novaAnimeXL_ilV190.safetensors"  # SDXL 系。1024 幅を素直に出せる


def post(path, payload):
    req = urllib.request.Request(
        HOST + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req, timeout=60).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path, timeout=60).read())


def build(seed, positive, negative, width=1152, height=640):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": positive, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["1", 1]}},
        "4": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": 28,
                "cfg": 5.0,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0],
            },
        },
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {
            "class_type": "SaveImage",
            "inputs": {"images": ["6", 0], "filename_prefix": "site-decor"},
        },
    }


def run(out_path, seed, positive, negative, width=1152, height=640):
    res = post("/prompt", {"prompt": build(seed, positive, negative, width, height)})
    pid = res["prompt_id"]
    print("queued:", pid)

    for _ in range(600):  # 最大 10 分待つ
        time.sleep(1)
        hist = get("/history/" + pid)
        if pid in hist:
            outputs = hist[pid]["outputs"]
            images = outputs["7"]["images"]
            img = images[0]
            q = urllib.parse.urlencode(
                {
                    "filename": img["filename"],
                    "subfolder": img.get("subfolder", ""),
                    "type": img.get("type", "output"),
                }
            )
            data = urllib.request.urlopen(HOST + "/view?" + q, timeout=60).read()
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "wb") as f:
                f.write(data)
            print("saved:", out_path, len(data), "bytes")
            return
    print("timeout")
    sys.exit(1)


if __name__ == "__main__":
    run(sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4])
