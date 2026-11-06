#!/usr/bin/env python3
"""README visuals for dsh-test-drive (docs/assets/).

Two figures, both read off the shipped source rather than a generic template.

  hero 1440x576 (Pillow, 4 files: zh/en x light/dark)
      The product shot is the receipt of one real drive: target `dsh-click`,
      run id `tdr_0b9b6e6a...`, the six stages with the status words the code
      writes (`pass` / `boot-ok` / `observed`), the durations from the sample
      record in README.md, the isolation strip (throwaway DSH_HOME, workspace,
      pnpm-store; host profile 0 reads / 0 writes) and the verdict line that
      `verdictOf()` composes. The left column is the name, the value lines and
      the footer.

  flow 1100x660 (hand-written SVG, 2 files: light/dark)
      Grammar: a CLEAN-ROOM ENVELOPE, not a row of arrowed boxes.
      One owned `mkdtemp` root is drawn as an enclosing room; inside it sit the
      three throwaway sub-roots (`home/` = DSH_HOME, `workspace/` = child cwd,
      `pnpm-store/` = npm_config_store_dir), the five-stage spine
      (install -> config -> smoke -> capability -> uninstall) and, at the floor,
      the `finally` drain: dry-run plan -> quarantine rename -> rm retries,
      which runs on pass, fail, timeout AND abort. Outside the room on the left
      are the entry surfaces and the host profile that is never opened; outside
      on the right are the structured record, the ordered verdict rules and the
      batch matrix. Nothing crosses the wall except the target going in and the
      record coming out.

Facts are taken from:
  src/drive.ts            stage order, finally cleanup, statuses
  src/result.ts           verdictOf() rules, schema discriminator
  src/workspace.ts        mkdtemp layout, ownership checks, cleanup ladder
  src/driver.ts           real argv per stage, allowBuilds retry, boot markers
  src/capability.ts       tool/command assertion over the durable session log
  src/batch.ts            drive-batch job, matrix rows/totals
  README.md sample record  durations, run id, `dsh-click@0.2.0`

Run once:  python scripts/gen-readme-assets.py
Requires:  Pillow; msyh.ttc / msyhbd.ttc / consola.ttf / consolab.ttf.
"""
from __future__ import annotations

import os
from html import escape

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

FONT_CJK = r"C:\Windows\Fonts\msyh.ttc"
FONT_CJK_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"
FONT_MONO_BOLD = r"C:\Windows\Fonts\consolab.ttf"
for _p in (FONT_CJK, FONT_CJK_BOLD, FONT_MONO, FONT_MONO_BOLD):
    if not os.path.exists(_p):
        raise SystemExit(f"FATAL: font missing: {_p}")

RADIUS = 22
SHADOW = 26
FONT_FILES = {"cjk": FONT_CJK, "cjk_bold": FONT_CJK_BOLD,
              "mono": FONT_MONO, "mono_bold": FONT_MONO_BOLD}

SKIN = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8",
        card="#ffffff", card_edge="#e6e2ef",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", green="#16a34a", amber="#b45309", red="#b42318",
        pill="#ece7f9", band="#f5f2fb", grid="#e7e4f0",
        green_bg="#e8f6ee", amber_bg="#fdf3e9", red_bg="#fdecea",
        shadow=(32, 26, 64), glow2="#7a68c9", badge_text="#ffffff",
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016",
        card="#1b2231", card_edge="#2e374b",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", green="#3fb950", amber="#d9a441", red="#f0776c",
        pill="#242d42", band="#202839", grid="#262f42",
        green_bg="#15301f", amber_bg="#2a2216", red_bg="#33191b",
        shadow=(0, 0, 0), glow2="#8496f5", badge_text="#0c1016",
    ),
}


def font(size: int, kind: str = "cjk_bold") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_FILES[kind], size)


def hx(s: str) -> tuple[int, int, int]:
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def gradient(w: int, h: int, c1: str, c2: str) -> Image.Image:
    base = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(base)
    a, b = hx(c1), hx(c2)
    for y in range(h):
        t = 0.15 * (y / h) + 0.85 * (y / h) ** 1.35
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(a, b)))
    return base


def glow(img: Image.Image, cx: int, cy: int, r: int, color: tuple,
         alpha: int = 40) -> Image.Image:
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(9, 0, -1):
        rr = r * i / 9
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 10)),))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def card(img: Image.Image, box: tuple, s: dict, radius: int = RADIUS,
         shadow: int = SHADOW, fill: str | None = None) -> Image.Image:
    """A soft-shadowed rounded card on the gradient background."""
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i in range(shadow, 0, -3):
        sd.rounded_rectangle([x0 - i // 5, y0 + i // 2, x1 + i // 5, y1 + i],
                             radius=radius + i // 5,
                             fill=s["shadow"] + (int(9 * (1 - i / shadow)),))
    base = Image.alpha_composite(img.convert("RGBA"),
                                 sh.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(fill or s["card"]),
                        outline=hx(s["card_edge"]), width=2)
    return base.convert("RGB")


_SCRATCH = ImageDraw.Draw(Image.new("RGB", (8, 8)))


def measure(text: str, size: int, kind: str) -> float:
    return _SCRATCH.textlength(text, font=font(size, kind))


def require_w(text: str, size: int, kind: str, max_w: float, what: str) -> None:
    """Fail loudly instead of shipping a clipped label."""
    w = measure(text, size, kind)
    if w > max_w + 0.4:
        raise SystemExit(f"FATAL: {what} overflows: {text!r} needs {w:.1f}px > {max_w}px")


def fit(text: str, kind: str, max_w: float, start: int, minimum: int) -> int:
    size = start
    while size > minimum:
        if measure(text, size, kind) <= max_w:
            return size
        size -= 1
    raise SystemExit(f"FATAL: text does not fit {max_w}px at >= {minimum}px: {text!r}")


def fit_lines(lines: list[str], kind: str, max_w: float, start: int,
              minimum: int) -> int:
    return min(fit(t, kind, max_w, start, minimum) for t in lines)


def pill(img: Image.Image, xy: tuple[int, int], text: str, s: dict,
         size: int = 16, fg: str | None = None, bg: str | None = None,
         kind: str = "cjk_bold") -> tuple[int, int]:
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    w = d.textlength(text, font=f)
    x, y = xy
    h = size + 20
    d.rounded_rectangle([x, y, x + w + 30, y + h], radius=h // 2,
                        fill=hx(bg or s["pill"]))
    d.text((x + 15, y + h / 2), text, font=f, fill=hx(fg or s["accent"]),
           anchor="lm")
    return int(x + w + 30), int(y + h)


def chip(img: Image.Image, xy: tuple[int, int], text: str, fg: str, bg: str,
         size: int = 11, kind: str = "cjk_bold", padx: int = 9,
         height: int = 20) -> int:
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    w = d.textlength(text, font=f)
    x, y = xy
    d.rounded_rectangle([x, y, x + w + padx * 2, y + height],
                        radius=height // 2, fill=hx(bg))
    d.text((x + padx, y + height / 2), text, font=f, fill=hx(fg), anchor="lm")
    return int(w + padx * 2)


# --------------------------------------------------------------------------- hero
# One real drive (README.md sample record + the short example). Status words are
# the values src/result.ts writes; durations are the sample record's.
HERO = {
    "zh": dict(
        kicker="DeepSeek Harness 插件 · 隔离实测台",
        value=["装、启、断言、卸载，一次跑完", "宿主 ~/.dsh 全程不被读写"],
        sub=["一次性 DSH_HOME、一次性工作目录、重定向的 pnpm store；",
             "宿主 profile 不读不写，结果落成 dsh-test-drive/v1 记录。"],
        meta="六段 · 隔离 · 能力断言 · schema dsh-test-drive/v1",
        foot="Apache-2.0 · PerryLink DSH plugin family",
        foot2="test_drive · /testdrive · drive_report",
        card_title="test_drive",
        target="dsh-click",
        run="tdr_0b9b6e6a… · 45,120 ms · win32 · node v22.22.3",
        installed="Installed dsh-click@0.2.0 · dsh.bundle.patch present",
        iso_left="throwaway DSH_HOME · workspace · pnpm-store",
        iso_right="host: 0 reads / 0 writes",
        verdict="verdict · install, patch, boot, and uninstall verified; headless task inconclusive",
        record="schema: dsh-test-drive/v1",
        record2="runs[] · matrices[] · latest pointer → Markdown / JUnit",
        chips=["test_drive", "/testdrive", "drive_report"],
    ),
    "en": dict(
        kicker="DeepSeek Harness plugin · isolated test bench",
        value=["Install, boot, assert, remove — once", "your ~/.dsh is never read or written"],
        sub=["one throwaway DSH_HOME, working directory, and pnpm store;",
             "the host profile is untouched and the record is machine-readable."],
        meta="six stages · isolated · capability assertion · schema v1",
        foot="Apache-2.0 · PerryLink DSH plugin family",
        foot2="test_drive · /testdrive · drive_report",
        card_title="test_drive",
        target="dsh-click",
        run="tdr_0b9b6e6a… · 45,120 ms · win32 · node v22.22.3",
        installed="Installed dsh-click@0.2.0 · dsh.bundle.patch present",
        iso_left="throwaway DSH_HOME · workspace · pnpm-store",
        iso_right="host: 0 reads / 0 writes",
        verdict="verdict · install, patch, boot, and uninstall verified; headless task inconclusive",
        record="schema: dsh-test-drive/v1",
        record2="runs[] · matrices[] · latest pointer → Markdown / JUnit",
        chips=["test_drive", "/testdrive", "drive_report"],
    ),
}

# stage, status word, duration as recorded (cleanup carries no duration)
HERO_STAGES = [
    ("install", "pass", "30412"),
    ("config", "pass", "2310"),
    ("smoke", "boot-ok", "4123"),
    ("capability", "observed", "8123"),
    ("uninstall", "pass", "5123"),
    ("cleanup", "pass", "—"),
]
STATUS_COLOR = {"pass": "green", "boot-ok": "amber", "observed": "accent",
                "fail": "red", "skipped": "faint"}


def hero(lang: str, skin: str) -> None:
    s = SKIN[skin]
    H = HERO[lang]
    W, HT = 1440, 576
    img = gradient(W, HT, s["bg_from"], s["bg_to"])
    img = glow(img, 1180, 40, 460, hx(s["accent"]),
               24 if skin == "light" else 40)
    img = glow(img, 70, 570, 300, hx(s["glow2"]),
               10 if skin == "light" else 16)

    d = ImageDraw.Draw(img)
    m = 64
    col_w = 600

    # ---- left column: kicker / title / value / sub / meta / footer -----------
    pill(img, (m, 50), H["kicker"], s, size=17)
    d = ImageDraw.Draw(img)

    title_size = fit("dsh-test-drive", "mono_bold", col_w, 60, 48)
    d.text((m - 2, 106), "dsh-test-drive", font=font(title_size, "mono_bold"),
           fill=hx(s["text"]))

    vf = fit_lines(H["value"], "cjk_bold", col_w, 38, 30)
    for i, line in enumerate(H["value"]):
        d.text((m, 196 + i * 54), line, font=font(vf, "cjk_bold"),
               fill=hx(s["text"]))

    sf = fit_lines(H["sub"], "cjk", col_w, 20, 16)
    for i, line in enumerate(H["sub"]):
        d.text((m + 1, 312 + i * 31), line, font=font(sf, "cjk"),
               fill=hx(s["sub"]))

    mf = fit(H["meta"], "cjk", col_w, 18, 12)
    require_w(H["foot"], 16, "cjk", col_w, "hero footer")
    require_w(H["foot2"], 14, "cjk", col_w, "hero footer 2")
    d.text((m + 1, 396), H["meta"], font=font(mf, "cjk"), fill=hx(s["faint"]))
    d.line([m + 1, 444, m + col_w - 6, 444], fill=hx(s["grid"]), width=2)
    d.text((m + 1, 458), H["foot"], font=font(16, "cjk"), fill=hx(s["faint"]))
    d.text((m + 1, 488), H["foot2"], font=font(14, "cjk"), fill=hx(s["faint"]))

    # ---- right: the receipt of one drive ------------------------------------
    img = card(img, (700, 36, 1376, 396), s, radius=RADIUS, shadow=SHADOW)
    d = ImageDraw.Draw(img)

    d.text((724, 56), H["card_title"], font=font(15, "mono_bold"),
           fill=hx(s["accent"]))
    tw = measure(H["card_title"], 15, "mono_bold")
    chip(img, (724 + int(tw) + 12, 55), H["target"], s["sub"], s["band"],
         size=11.5, kind="mono_bold")
    d = ImageDraw.Draw(img)

    # verdict pill, right aligned on the card
    vtxt = "pass"
    vw = measure(vtxt, 15, "mono_bold")
    pill(img, (1352 - int(vw) - 30, 50), vtxt, s, size=15,
         fg=s["green"], bg=s["green_bg"], kind="mono_bold")
    d = ImageDraw.Draw(img)

    require_w(H["run"], 13, "mono", 628, "hero run meta")
    d.text((724, 84), H["run"], font=font(13, "mono"), fill=hx(s["sub"]))
    require_w(H["installed"], 12.5, "cjk", 628, "hero installed line")
    d.text((724, 106), H["installed"], font=font(12.5, "cjk"), fill=hx(s["sub"]))

    # isolation strip
    d.rounded_rectangle([724, 128, 1352, 166], radius=12, fill=hx(s["band"]))
    require_w(H["iso_left"], 12, "cjk", 380, "hero isolation left")
    d.text((740, 139), H["iso_left"], font=font(12, "cjk"), fill=hx(s["sub"]))
    rw = measure(H["iso_right"], 12, "cjk_bold")
    d.text((1336 - int(rw), 139), H["iso_right"], font=font(12, "cjk_bold"),
           fill=hx(s["green"]))

    # stage table
    d.text((724, 182), "stage", font=font(11, "cjk"), fill=hx(s["faint"]))
    d.text((1000, 182), "result", font=font(11, "cjk"), fill=hx(s["faint"]))
    d.text((1352, 182), "ms", font=font(11, "cjk"), fill=hx(s["faint"]),
           anchor="ra")
    d.line([724, 197, 1352, 197], fill=hx(s["grid"]), width=1)

    y = 204
    for i, (stage, status, ms) in enumerate(HERO_STAGES):
        cy = y + 13
        d.ellipse([986 - 4, cy - 4, 986 + 4, cy + 4], fill=hx(s[STATUS_COLOR[status]]))
        d.text((724, y), stage, font=font(13, "mono"), fill=hx(s["text"]))
        d.text((1000, y - 1), status, font=font(12.5, "cjk_bold"),
               fill=hx(s[STATUS_COLOR[status]]))
        d.text((1352, y + 1), ms, font=font(11.5, "mono"), fill=hx(s["faint"]),
               anchor="ra")
        if i < len(HERO_STAGES) - 1:
            d.line([724, y + 22, 1352, y + 22], fill=hx(s["grid"]), width=1)
        y += 26

    require_w(H["verdict"], 12.5, "cjk", 628, "hero verdict line")
    d.text((724, 364), H["verdict"], font=font(12.5, "cjk"), fill=hx(s["sub"]))

    # ---- right: the record this drive leaves behind --------------------------
    img = card(img, (700, 412, 1376, 524), s, radius=RADIUS, shadow=18)
    d = ImageDraw.Draw(img)
    d.text((724, 426), H["record"], font=font(13.5, "mono_bold"),
           fill=hx(s["accent"]))
    require_w(H["record2"], 13, "cjk", 628, "hero record line")
    d.text((724, 450), H["record2"], font=font(13, "cjk"), fill=hx(s["sub"]))
    x = 724
    for label in H["chips"]:
        w = chip(img, (x, 474), label, s["accent"], s["band"], size=11.5,
                 kind="mono", padx=11, height=22)
        d = ImageDraw.Draw(img)
        x += w + 8

    name = f"dsh-test-drive-hero-{lang}-{skin}.webp"
    img.save(os.path.join(OUT, name), "WEBP", quality=92, method=6)
    print(f"wrote {name} ({W}x{HT})")


# --------------------------------------------------------------------------- flow
FLOW = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8",
        panel="#ffffff", edge="#e6e2ef", band="#f5f2fb", band_alt="#faf8fe",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", green="#16a34a", amber="#b45309", red="#b42318",
        rule="#dcd8ea", shadow="0.10",
        green_bg="#e8f6ee", amber_bg="#fdf3e9", accent_bg="#ece7f9",
        badge_text="#ffffff",
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016",
        panel="#1b2231", edge="#2e374b", band="#202839", band_alt="#1e2534",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", green="#3fb950", amber="#d9a441", red="#f0776c",
        rule="#2b3348", shadow="0.45",
        green_bg="#15301f", amber_bg="#2a2216", accent_bg="#242d42",
        badge_text="#0c1016",
    ),
}

FONT_CSS_CJK = ("'Microsoft YaHei','PingFang SC','Noto Sans CJK SC',"
                "'Source Han Sans SC',sans-serif")
FONT_CSS_MONO = ("'Consolas','SFMono-Regular','Menlo',ui-monospace,monospace")

# stage number, label, real argv/token, status word, evidence, colour, optional
STAGES = [
    ("1", "install", "dsh plugin --profile <p> add <spec>", "pass",
     "exit 0 · allowBuilds retry", "green", False),
    ("2", "config", "dsh --profile <p> --dump-config", "pass",
     "patchEffective · layers[]", "green", False),
    ("3", "smoke", 'dsh --profile <p> "<headlessTask>"', "boot-ok",
     "no FAILED markers", "amber", False),
    ("4", "capability (optional)", "task → newest session log", "observed",
     "tool/call → tool/result", "accent", True),
    ("5", "uninstall", "dsh plugin --profile <p> remove <pkg>", "pass",
     "exit 0", "green", False),
]

ROOMS = [("home/", "DSH_HOME"), ("workspace/", "child cwd"),
         ("pnpm-store/", "npm_config_store_dir")]

VERDICT_ROWS = [
    ("fail", "red", "install / smoke / capability failure"),
    ("pass", "green", "install + patch + clean boot + remove"),
    ("partial", "amber", "installed, a later assurance missing"),
    ("unknown", "faint", "nothing decisive ran"),
]


class Svg:
    """Tiny SVG writer that measures every label before it is emitted."""

    def __init__(self) -> None:
        self.parts: list[str] = []
        self.overflows: list[str] = []

    def add(self, markup: str) -> None:
        self.parts.append(markup)

    def text(self, x: float, y: float, content: str, size: float, fill: str, *,
             anchor: str = "start", weight: int | None = None,
             mono: bool = False, max_w: float | None = None,
             opacity: float | None = None, tracking: float | None = None) -> None:
        kind = "mono" if mono else "cjk"
        if weight:
            kind += "_bold"
        if max_w is not None:
            w = measure(content, size, kind)
            if tracking:
                w += tracking * max(len(content) - 1, 0)
            if w > max_w + 0.4:
                self.overflows.append(f"{content!r} needs {w:.1f}px > {max_w}px")
        family = FONT_CSS_MONO if mono else FONT_CSS_CJK
        attrs = [f'x="{x}"', f'y="{y}"', f'fill="{fill}"',
                 f'font-family="{family}"', f'font-size="{size}"']
        if anchor != "start":
            attrs.append(f'text-anchor="{anchor}"')
        if weight:
            attrs.append(f'font-weight="{weight}"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        if tracking:
            attrs.append(f'letter-spacing="{tracking}"')
        self.add(f'<text {" ".join(attrs)}>{escape(content)}</text>')

    def rect(self, x: float, y: float, w: float, h: float, *, fill: str,
             rx: float = 0, stroke: str | None = None, sw: float = 1.5,
             shadow: bool = False, dash: str | None = None,
             opacity: float | None = None) -> None:
        attrs = [f'x="{x}"', f'y="{y}"', f'width="{w}"', f'height="{h}"']
        if rx:
            attrs.append(f'rx="{rx}"')
        attrs.append(f'fill="{fill}"')
        if stroke:
            attrs.append(f'stroke="{stroke}"')
            attrs.append(f'stroke-width="{sw}"')
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        if shadow:
            attrs.append('filter="url(#soft)"')
        self.add(f'<rect {" ".join(attrs)}/>')

    def line(self, x1: float, y1: float, x2: float, y2: float, *, stroke: str,
             sw: float = 1.5, dash: str | None = None,
             marker: str | None = None, opacity: float | None = None) -> None:
        attrs = [f'x1="{x1}"', f'y1="{y1}"', f'x2="{x2}"', f'y2="{y2}"',
                 f'stroke="{stroke}"', f'stroke-width="{sw}"']
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        if marker:
            attrs.append(f'marker-end="url(#{marker})"')
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add(f'<line {" ".join(attrs)}/>')

    def path(self, d: str, *, stroke: str, sw: float = 1.5,
             marker: str | None = None, dash: str | None = None,
             fill: str = "none") -> None:
        attrs = [f'd="{d}"', f'fill="{fill}"', f'stroke="{stroke}"',
                 f'stroke-width="{sw}"', 'stroke-linecap="round"',
                 'stroke-linejoin="round"']
        if dash:
            attrs.append(f'stroke-dasharray="{dash}"')
        if marker:
            attrs.append(f'marker-end="url(#{marker})"')
        self.add(f'<path {" ".join(attrs)}/>')

    def circle(self, cx: float, cy: float, r: float, fill: str, *,
               stroke: str | None = None, sw: float = 1.5) -> None:
        attrs = [f'cx="{cx}"', f'cy="{cy}"', f'r="{r}"', f'fill="{fill}"']
        if stroke:
            attrs += [f'stroke="{stroke}"', f'stroke-width="{sw}"']
        self.add(f'<circle {" ".join(attrs)}/>')

    def chip_left(self, x: float, y: float, label: str, fg: str, bg: str, *,
                  size: float = 11, pad: float = 10, height: float = 22,
                  mono: bool = False, weight: int | None = None) -> float:
        kind = ("mono" if mono else "cjk") + ("_bold" if weight else "")
        w = measure(label, size, kind) + pad * 2
        self.rect(x, y, w, height, fill=bg, rx=height / 2)
        self.text(x + pad, y + height / 2 + size * 0.34, label, size, fg,
                  weight=weight, mono=mono)
        return w

    def chip_right(self, x_right: float, y: float, label: str, fg: str, bg: str,
                   *, size: float = 11, pad: float = 10, height: float = 22,
                   mono: bool = False, weight: int | None = None) -> float:
        kind = ("mono" if mono else "cjk") + ("_bold" if weight else "")
        w = measure(label, size, kind) + pad * 2
        x = x_right - w
        self.rect(x, y, w, height, fill=bg, rx=height / 2)
        self.text(x + pad, y + height / 2 + size * 0.34, label, size, fg,
                  weight=weight, mono=mono)
        return x

    def svg(self, w: int, h: int, label: str) -> str:
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" '
                f'height="{h}" viewBox="0 0 {w} {h}" role="img" '
                f'aria-label="{escape(label)}">')
        return "\n".join([head, *self.parts, "</svg>"]) + "\n"


def flow_svg(skin: str) -> str:
    s = FLOW[skin]
    W, H = 1100, 660
    v = Svg()

    v.add("<defs>")
    v.add(f'<linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">'
          f'<stop offset="0" stop-color="{s["bg_from"]}"/>'
          f'<stop offset="1" stop-color="{s["bg_to"]}"/></linearGradient>')
    v.add(f'<filter id="soft" x="-30%" y="-30%" width="160%" height="170%">'
          f'<feDropShadow dx="0" dy="7" stdDeviation="9" '
          f'flood-color="#16122c" flood-opacity="{s["shadow"]}"/></filter>')
    v.add('<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" '
          'markerWidth="6.4" markerHeight="6.4" orient="auto-start-reverse">'
          f'<path d="M0 0 L10 5 L0 10 z" fill="{s["accent"]}"/></marker>')
    v.add("</defs>")
    v.add(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')

    # ---- header -------------------------------------------------------------
    v.text(44, 56, "dsh-test-drive", 27, s["text"], weight=700, mono=True,
           max_w=420)
    v.text(44, 84,
           "one target → one owned throwaway root → five stages + a finally "
           "drain → one record; the host profile never opens", 14, s["sub"],
           max_w=790)
    v.chip_right(1056, 34, "schema: dsh-test-drive/v1", s["accent"], s["band"],
                 size=12, pad=12, height=26, mono=True)
    v.line(44, 104, 1056, 104, stroke=s["rule"], sw=1)

    # ---- left rail: entry surface / target kinds / the host that stays out --
    v.rect(44, 116, 172, 184, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(60, 140, "ENTER", 11, s["faint"], tracking=1.4)
    for i, label in enumerate(("test_drive(target)", "/testdrive a b c",
                               "drive_report(id)")):
        v.text(60, 164 + i * 22, label, 12.5, s["text"], mono=True, max_w=140)
    v.line(60, 222, 200, 222, stroke=s["rule"], sw=1)
    v.text(60, 244, "TARGET", 11, s["faint"], tracking=1.4)
    v.text(60, 268, "repo · npm", 12.5, s["text"], mono=True, max_w=140)
    v.text(60, 290, "path · .tgz", 12.5, s["text"], mono=True, max_w=140)

    v.rect(44, 316, 172, 268, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(60, 340, "STAYS OUTSIDE", 11, s["faint"], tracking=1.2)
    v.path("M65 356 v-8 a9 9 0 0 1 18 0 v8", stroke=s["accent"], sw=2.2)
    v.rect(60, 356, 28, 22, fill=s["band"], rx=5, stroke=s["accent"], sw=1.6)
    v.circle(74, 366, 2.6, s["accent"])
    v.text(98, 366, "~/.dsh", 14, s["text"], weight=700, mono=True, max_w=100)
    v.text(98, 384, "host profile", 11, s["sub"], max_w=100)
    v.line(60, 404, 200, 404, stroke=s["rule"], sw=1)
    v.circle(66, 420, 3.5, s["green"])
    v.text(78, 416, "0 reads", 12.5, s["text"], max_w=100)
    v.circle(66, 442, 3.5, s["green"])
    v.text(78, 438, "0 writes", 12.5, s["text"], max_w=100)
    v.text(60, 470, "hostHomeTouched: false", 11, s["green"], mono=True,
           max_w=140)
    v.text(60, 492, "forwardEnv → names only", 11, s["faint"], max_w=140)
    v.line(60, 512, 200, 512, stroke=s["rule"], sw=1)
    v.text(60, 534, "no %TEMP% scan", 11, s["faint"], max_w=140)
    v.text(60, 556, "no foreign prefixes", 11, s["faint"], max_w=140)

    # entry elbow: the target crosses into the clean room at the install row
    v.path("M216 240 H226 V253 H246", stroke=s["accent"], sw=1.8, marker="arr")

    # ---- the clean-room envelope -------------------------------------------
    v.rect(236, 116, 524, 468, fill=s["band"], rx=22, stroke=s["accent"],
           sw=2, shadow=True)
    v.text(252, 140, "ONE OWNED TEMP ROOT", 11, s["faint"], tracking=1.2)
    v.chip_right(744, 126, "mkdtemp · dsh-test-drive-", s["accent"],
                 s["panel"], size=11, pad=10, height=22, mono=True)

    # the three throwaway sub-roots
    room_w, gap = 158, 7
    for i, (name, sub) in enumerate(ROOMS):
        x = 252 + i * (room_w + gap)
        v.rect(x, 160, room_w, 42, fill=s["panel"], rx=10, stroke=s["edge"],
               sw=1.2)
        v.text(x + 12, 177, name, 13, s["text"], weight=700, mono=True,
               max_w=room_w - 22)
        v.text(x + 12, 194, sub, 11, s["faint"], mono=True, max_w=room_w - 22)

    v.text(252, 218,
           "ownership registry · owned prefix · direct child of the OS temp dir",
           11, s["faint"], max_w=492)

    # stage spine
    row_x, row_w, row_h, row_gap = 248, 500, 50, 7
    for i in range(len(STAGES) - 1):
        y = 228 + i * (row_h + row_gap)
        v.line(270, y + row_h - 13, 270, y + row_h + row_gap + 13,
               stroke=s["rule"], sw=1.6)

    for i, (num, name, cmd, status, evidence, colour, optional) in enumerate(STAGES):
        y = 228 + i * (row_h + row_gap)
        v.rect(row_x, y, row_w, row_h, fill=s["panel"], rx=12,
               stroke=s["edge"], sw=1.4,
               dash="6 5" if optional else None)
        v.circle(270, y + 25, 12, s[colour])
        v.text(270, y + 29.5, num, 12, s["badge_text"], anchor="middle",
               weight=700, mono=True)
        v.text(294, y + 21, name, 13.5, s["text"], weight=700, mono=True,
               max_w=250)
        v.text(294, y + 38, cmd, 11, s["sub"], mono=True, max_w=350)
        bg = s[colour + "_bg"] if colour in ("green", "amber") else s["accent_bg"]
        v.chip_right(732, y + 7, status, s[colour], bg,
                     size=11.5, pad=10, height=20, mono=True, weight=700)
        v.text(732, y + 44, evidence, 11, s["faint"], anchor="end", mono=True,
               max_w=190)

    # the finally drain: the cleanup ladder every exit path goes through
    v.rect(row_x, 510, row_w, 66, fill=s["panel"], rx=14, stroke=s["rule"],
           sw=1.2)
    v.text(266, 531, "finally · runs on pass · fail · timeout · abort",
           11.5, s["accent"], weight=700, max_w=350)
    v.text(732, 531, "→ registry empty", 11, s["green"], anchor="end",
           max_w=140)
    x = 266
    for i, label in enumerate(("dry-run plan", "quarantine rename",
                               "rm ×3 retries")):
        if i > 0:
            v.line(x, 553, x + 14, 553, stroke=s["faint"], sw=1.4, marker="arr")
            x += 20
        x += v.chip_left(x, 542, label, s["text"], s["band_alt"], size=11,
                         pad=10, height=22, mono=True)

    # ---- output column: record / verdict rules / batch ----------------------
    v.path("M760 200 H772", stroke=s["accent"], sw=1.6)
    v.line(772, 200, 772, 526, stroke=s["accent"], sw=1.6, opacity=0.5)
    for y in (200, 376, 526):
        v.line(772, y, 786, y, stroke=s["accent"], sw=1.6, marker="arr")

    # record card
    v.rect(790, 116, 266, 164, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(806, 140, "OUTPUT · ONE RECORD", 11, s["accent"], tracking=1.1)
    v.text(806, 164, "DriveResult", 13.5, s["text"], weight=700, mono=True,
           max_w=230)
    v.text(806, 186, "schema: dsh-test-drive/v1", 11, s["sub"], mono=True,
           max_w=230)
    v.text(806, 208, "stages[] · isolation · verdict", 11, s["sub"], max_w=230)
    v.text(806, 228, "runs[] · matrices[] · latest", 11, s["sub"], max_w=230)
    v.text(806, 248, "Markdown · JUnit renderers", 11, s["sub"], max_w=230)
    v.text(806, 268, "dsh-score / CI consume it", 11, s["faint"], max_w=230)

    # verdict rules card
    v.rect(790, 292, 266, 172, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(806, 314, "VERDICT · ORDER MATTERS", 11, s["accent"], tracking=1.1)
    for i, (label, colour, rule) in enumerate(VERDICT_ROWS):
        y = 340 + i * 32
        v.text(806, y, label, 11.5, s[colour], weight=700, mono=True, max_w=230)
        v.text(806, y + 14, rule, 11, s["sub"], max_w=232)

    # batch card
    v.rect(790, 472, 266, 112, fill=s["panel"], rx=18, stroke=s["edge"],
           sw=1.5, shadow=True)
    v.text(806, 496, "BATCH · /TESTDRIVE", 11, s["accent"], tracking=1.1)
    v.text(806, 520, "drive-batch job · serial by default", 11, s["sub"],
           max_w=232)
    v.text(806, 542, "rows[] · totals · progress stream", 11, s["sub"],
           max_w=232)
    v.text(806, 564, "matrix tdm_… → drive_report reads it", 11, s["sub"],
           max_w=232)

    # ---- footer -------------------------------------------------------------
    v.line(44, 600, 1056, 600, stroke=s["rule"], sw=1)
    v.text(44, 620,
           "verdictOf() is order-sensitive: install fail → fail · smoke fail → "
           "fail · capability failed → fail · then pass · partial · unknown",
           11, s["sub"], max_w=1012)
    v.text(44, 640,
           "argv only, never a shell · credentials stripped (forwardEnv forwards "
           "names) · keepTempDirs keeps the root and drops ownership · reports sanitized",
           11, s["faint"], max_w=1012)

    if v.overflows:
        raise SystemExit("FATAL: SVG label overflow:\n  " + "\n  ".join(v.overflows))
    return v.svg(
        W, H,
        "dsh-test-drive structure: one owned temp root as a clean-room envelope "
        "holding three throwaway sub-roots and the five-stage spine "
        "(install, config, smoke, capability, uninstall); a finally drain removes "
        "the root on every exit path, while the structured record and the ordered "
        "verdict rules leave the envelope on the right and the host profile stays "
        "outside, never opened")


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for skin in ("light", "dark"):
        for lang in ("zh", "en"):
            hero(lang, skin)
        name = f"dsh-test-drive-flow-v5-{skin}.svg"
        with open(os.path.join(OUT, name), "w", encoding="utf-8",
                  newline="\n") as fh:
            fh.write(flow_svg(skin))
        print(f"wrote {name} (1100x660)")


if __name__ == "__main__":
    main()
