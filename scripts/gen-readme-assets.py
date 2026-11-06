#!/usr/bin/env python3
"""Generate README image assets for dsh-test-drive (docs/assets/).

Outputs (idempotent overwrite):
  dsh-test-drive-flow-light.svg / dsh-test-drive-flow-dark.svg
      Hero pipeline diagram. Two hand-written SVG files (vector — never
      rasterized to webp). Text inside is command-surface tokens only
      (dsh plugin add, --dump-config, headless boot, capability,
      stages.install, ...), so all five README languages share the same pair.

There is no UI half and no benchmark data in this repository, so the script
does not synthesize screenshots or evidence charts — it only draws the real
pipeline: install → config → smoke → capability → uninstall → cleanup.

Run once:  python scripts/gen-readme-assets.py
Requires:  Pillow (pip install pillow); a CJK font is probed loudly for parity
           with the family asset scripts even though this SVG is ASCII-only.
"""
from __future__ import annotations

import os
import sys

from PIL import ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

# --- palette: PerryLink family (accent) + GitHub page backgrounds ----------
FAMILY = "#4B67B4"   # family accent (badges labelColor family uses #2B3245)
GREEN = {"light": "#16a34a", "dark": "#3fb950"}
SKIN = {
    "light": dict(bg="#ffffff", box="#f6f8fa", border="#d0d7de",
                  text="#1f2328", sub="#57606a"),
    "dark": dict(bg="#0d1117", box="#161b22", border="#30363d",
                 text="#f0f6fc", sub="#8b949e"),
}

# --- CJK font probe: keep the family contract even for an ASCII-only SVG ----
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyh.ttc",      # Microsoft YaHei
    r"C:\Windows\Fonts\simhei.ttf",    # SimHei
    r"C:\Windows\Fonts\Deng.ttf",      # DengXian
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/PingFang.ttc",
]
FONT_PATH = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)
if FONT_PATH is None:
    sys.exit("FATAL: no CJK font found (looked for msyh.ttc, simhei.ttf, "
             "Deng.ttf, Noto Sans CJK, PingFang). Refusing to run without the "
             "family font probe; install one of the probed fonts and re-run.")


def font(size: int) -> ImageFont.FreeTypeFont:
    """Probe that the discovered font actually opens at the requested size."""
    return ImageFont.truetype(FONT_PATH, size)


# ---------------------------------------------------------------------------
# Hero pipeline SVG (light + dark)
# ---------------------------------------------------------------------------
# One target through the real six-stage pipeline. `cleanup` is drawn on the
# bottom bar because it runs in a `finally`, after the uninstall stage.
FLOW_NODES = [
    ("dsh plugin add", "throwaway DSH_HOME"),
    ("--dump-config", "patch layer"),
    ("headless boot", "FAILED-marker scan"),
    ("capability", "tool → session log"),
    ("dsh plugin remove", "quarantine → delete"),
]


def flow_svg(skin: str) -> str:
    s = SKIN[skin]
    w, h = 1200, 400
    nw, nh, gap = 180, 96, 45
    y0 = 145
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" role="img" aria-label="dsh-test-drive '
        f'install-smoke pipeline">',
        '<title>dsh-test-drive install → smoke → cleanup pipeline</title>',
        f'<rect width="{w}" height="{h}" rx="18" fill="{s["bg"]}"/>',
        f'<text x="60" y="62" fill="{s["text"]}" font-family="ui-sans-serif,'
        f'system-ui,sans-serif" font-size="30" font-weight="700">'
        f'dsh-test-drive</text>',
        f'<text x="60" y="94" fill="{s["sub"]}" font-family="ui-monospace,'
        f'monospace" font-size="16">dsh plugin add → --dump-config → headless '
        f'boot → capability → dsh plugin remove → cleanup</text>',
        f'<line x1="60" y1="116" x2="1140" y2="116" stroke="{s["border"]}"/>',
    ]
    for i, (label, sub) in enumerate(FLOW_NODES):
        x = 60 + i * (nw + gap)
        accent = GREEN[skin] if i == len(FLOW_NODES) - 1 else (
            FAMILY if i == 3 else s["border"])
        parts.append(
            f'<rect x="{x}" y="{y0}" width="{nw}" height="{nh}" rx="14" '
            f'fill="{s["box"]}" stroke="{accent}" stroke-width="2"/>')
        parts.append(
            f'<text x="{x + nw // 2}" y="{y0 + 40}" fill="{s["text"]}" '
            f'text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="16" font-weight="700">{label}</text>')
        parts.append(
            f'<text x="{x + nw // 2}" y="{y0 + 68}" fill="{s["sub"]}" '
            f'text-anchor="middle" font-family="ui-monospace,monospace" '
            f'font-size="12">{sub}</text>')
        if i < len(FLOW_NODES) - 1:
            ax = x + nw + 6
            ay = y0 + nh // 2
            parts.append(
                f'<path d="M{ax} {ay}h{gap - 12}" stroke="{s["sub"]}" '
                f'stroke-width="3"/>')
            parts.append(
                f'<path d="M{ax + gap - 14} {ay - 7}l10 7-10 7" fill="none" '
                f'stroke="{s["sub"]}" stroke-width="3" '
                f'stroke-linecap="round" stroke-linejoin="round"/>')
    # result-contract bar under the stages
    bx, bw, by, bh = 220, 760, 268, 52
    parts.append(
        f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="12" '
        f'fill="{s["box"]}" stroke="{FAMILY}" stroke-width="2"/>')
    parts.append(
        f'<text x="{bx + bw // 2}" y="{by + 33}" fill="{s["text"]}" '
        f'text-anchor="middle" font-family="ui-monospace,monospace" '
        f'font-size="14">test_drive · /testdrive · drive_report → schema: '
        f'dsh-test-drive/v1</text>')
    parts.append(
        f'<text x="60" y="370" fill="{s["sub"]}" font-family="ui-monospace,'
        f'monospace" font-size="13">mkdtemp root · DSH_HOME · '
        f'npm_config_store_dir · ownership registry · hostHomeTouched: '
        f'false</text>')
    parts.append('</svg>')
    return "\n".join(parts) + "\n"


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    # Prove the probed family font opens (and fail loudly if it does not)
    # before writing the shared ASCII-only SVG pair.
    font(14)
    for skin in ("light", "dark"):
        with open(os.path.join(OUT, f"dsh-test-drive-flow-{skin}.svg"),
                  "w", encoding="utf-8", newline="\n") as fh:
            fh.write(flow_svg(skin))
    print("wrote 2 SVG assets to docs/assets/")


if __name__ == "__main__":
    main()
