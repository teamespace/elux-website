#!/usr/bin/env python3
"""
Generates every 8-bit sprite used in the closing CTA scene.

The art is source, not a binary blob: each frame is an ASCII grid below and the
palette maps straight onto the site's design tokens. Change a token, re-run,
and every sprite matches again.

    python3 scripts/gen-sprites.py

Convention, shared by all characters so one CSS rule drives all of them:
8 frames in a single row — 0-3 idle, 4-7 the click reaction.

Writes public/sprites/*.png
"""

from pathlib import Path
from PIL import Image

# Tuned for the beige CTA surface (#F1E9DA). If that section ever goes dark,
# the outline has to move to a mid tone — ink is the same colour as the espresso
# surface, so every silhouette would lose its edge and the flag pole, which is
# nothing but outline, would disappear completely.
PALETTE = {
    ".": (0, 0, 0, 0),             # transparent
    "K": (0x3E, 0x20, 0x02, 255),  # ink — outline
    "W": (0xFC, 0xF8, 0xF0, 255),  # cream — bodywork
    "S": (0xD8, 0xCB, 0xB6, 255),  # shadow
    "V": (0x2A, 0x16, 0x01, 255),  # visor / screen
    "G": (0xFF, 0x9D, 0x69, 255),  # glint
    "O": (0xA9, 0x54, 0x1F, 255),  # accent — harness, banner, thruster
    "B": (0x6D, 0x54, 0x3C, 255),  # ink-2 — boots, treads, shading
}

# On olive (#333A1B) an ink outline is barely distinguishable from the surface
# (1.25:1) and every silhouette loses its edge. Sprites placed there are emitted
# a second time with a mid-tone outline that clears both the surface and the
# cream bodywork.
PALETTE_ON_DARK = dict(PALETTE, K=(0x8A, 0x6A, 0x4A, 255), B=(0xB0, 0x8A, 0x63, 255))

# name -> also emit "<name>-dark" using PALETTE_ON_DARK
ALSO_ON_DARK = {"ufo", "astronaut", "flag", "walker", "liftoff", "cargo"}

FRAMES_PER_SHEET = 8


def pad(rows, w, h, lift=0):
    """Bottom-align rows in a w x h frame, raised by `lift` px."""
    blank = "." * w
    for i, r in enumerate(rows):
        if len(r) != w:
            raise SystemExit(f"row {i} is {len(r)} wide, expected {w}: {r!r}")
    top = h - len(rows) - lift
    if top < 0:
        raise SystemExit(f"frame overflows: {len(rows)} rows + {lift} lift > {h}")
    return [blank] * top + rows + [blank] * lift


# ═══════════════════════════════════════════════════════════════════════════
# ASTRONAUT — 18x25, walks across the section
# ═══════════════════════════════════════════════════════════════════════════
A_HEAD = [
    "......KKKKKK......",
    "....KKWWWWWWKK....",
    "...KWWWWWWWWWWK...",
    "...KWVVVVVVVVWK...",
    "...KWVGGVVVVVWK...",
    "...KWVVVVVVVVWK...",
    "...KWWWWWWWWWWK...",
    "....KKWWWWWWKK....",
    ".....KWWWWWWK.....",
]
A_ARMS_DOWN = [
    "..KKKOOOOOOOOKKK..",
    "..KWKOWWWWWWOKWK..",
    "..KWKOWWKKWWOKWK..",
    "..KWKOWWKKWWOKWK..",
    "..KBKOWWWWWWOKBK..",
    "..KKKOOOOOOOOKKK..",
]
A_ARMS_TUCK = [
    "..KKKOOOOOOOOKKK..",
    "...KKOWWWWWWOKK...",
    "..KWKOWWKKWWOKWK..",
    "..KWKOWWKKWWOKWK..",
    "..KBKOWWWWWWOKBK..",
    "..KKKOOOOOOOOKKK..",
]
A_ARMS_L = [
    "..KWKOOOOOOOOKKK..",
    "..KWKOWWWWWWOKWK..",
    "..KBKOWWKKWWOKWK..",
    "..KKKOWWKKWWOKWK..",
    "...KKOWWWWWWOKBK..",
    "..KKKOOOOOOOOKKK..",
]
A_ARMS_R = [
    "..KKKOOOOOOOOKWK..",
    "..KWKOWWWWWWOKWK..",
    "..KWKOWWKKWWOKBK..",
    "..KWKOWWKKWWOKKK..",
    "..KBKOWWWWWWOKK...",
    "..KKKOOOOOOOOKKK..",
]
A_ARMS_OUT = [
    ".KKKKOOOOOOOOKKKK.",
    ".KWWKOWWWWWWOKWWK.",
    "..KKKOWWKKWWOKKK..",
    "..KWKOWWKKWWOKWK..",
    "..KBKOWWWWWWOKBK..",
    "..KKKOOOOOOOOKKK..",
]
A_LEGS_APART = [
    ".....KWWWWWWK.....",
    ".....KWWKKWWK.....",
    "....KWWK..KWWK....",
    "....KWWK..KWWK....",
    "...KWSK....KSWK...",
    "...KBBK....KBBK...",
    "...KKKK....KKKK...",
]
A_LEGS_TOGETHER = [
    ".....KWWWWWWK.....",
    ".....KWWKKWWK.....",
    ".....KWWKKWWK.....",
    ".....KWWKKWWK.....",
    ".....KWSKKSWK.....",
    "....KBBBKKBBBK....",
    "....KKKKKKKKKK....",
]
A_LEGS_CROUCH = [
    ".....KWWWWWWK.....",
    "....KWWWWWWWWK....",
    "....KWWWKKWWWK....",
    "....KWSWKKWSWK....",
    "...KBBBK..KBBBK...",
    "...KKKKK..KKKKK...",
]
A_LEGS_TUCK_S = [
    ".....KWWWWWWK.....",
    "....KWWWWWWWWK....",
    "...KWWK....KWWK...",
    "...KBBK....KBBK...",
    "...KKKK....KKKK...",
    "....OO......OO....",
]
A_LEGS_TUCK_B = [
    ".....KWWWWWWK.....",
    "....KWWWWWWWWK....",
    "...KWWK....KWWK...",
    "...KBBK....KBBK...",
    "...KKKK....KKKK...",
    "....OO......OO....",
    ".....O........O...",
]

# Waving: the raised arm has to be drawn into the head rows, so the head itself
# gets variants rather than the arm block.
A_HEAD_WAVE_HI = [
    "......KKKKKK...KW.",
    "....KKWWWWWWKK.KW.",
    "...KWWWWWWWWWWKKW.",
    "...KWVVVVVVVVWKKB.",
    "...KWVGGVVVVVWK...",
    "...KWVVVVVVVVWK...",
    "...KWWWWWWWWWWK...",
    "....KKWWWWWWKK....",
    ".....KWWWWWWK.....",
]
A_HEAD_WAVE_LO = [
    "......KKKKKK......",
    "....KKWWWWWWKK.KW.",
    "...KWWWWWWWWWWKKW.",
    "...KWVVVVVVVVWKKW.",
    "...KWVGGVVVVVWKKB.",
    "...KWVVVVVVVVWK...",
    "...KWWWWWWWWWWK...",
    "....KKWWWWWWKK....",
    ".....KWWWWWWK.....",
]
# right arm omitted from the torso — it is up by the helmet
A_ARMS_WAVING = [
    "..KKKOOOOOOOOKKK..",
    "..KWKOWWWWWWOKK...",
    "..KWKOWWKKWWOK....",
    "..KWKOWWKKWWOK....",
    "..KBKOWWWWWWOK....",
    "..KKKOOOOOOOOKKK..",
]


ASTRONAUT = {
    "w": 18,
    "h": 25,
    "frames": [
        (A_HEAD + A_ARMS_L + A_LEGS_APART, 0),
        (A_HEAD + A_ARMS_DOWN + A_LEGS_TOGETHER, 1),
        (A_HEAD + A_ARMS_R + A_LEGS_APART, 0),
        (A_HEAD + A_ARMS_TUCK + A_LEGS_TOGETHER, 1),
        (A_HEAD + A_ARMS_DOWN + A_LEGS_CROUCH, 0),
        (A_HEAD + A_ARMS_OUT + A_LEGS_TUCK_S, 2),
        (A_HEAD + A_ARMS_OUT + A_LEGS_TUCK_B, 3),
        (A_HEAD + A_ARMS_DOWN + A_LEGS_CROUCH, 1),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# FLAG — 16x26, planted; banner ripples
# ═══════════════════════════════════════════════════════════════════════════
def flag(banner):
    pole_top = ["...K............"]
    body = ["...K" + b for b in banner]
    pole = ["...K............"] * 12
    base = [
        "..KKKKK.........",
        ".KKBBBKK........",
    ]
    return pole_top + body + pole + base


F_A = ["OOOOOOOOO...", "OWWWWWWWO...", "OWWOOOWWO...", "OWWWWWWWO...", "OOOOOOOO...."]
F_B = [".OOOOOOOO...", "OWWWWWWWWO..", "OWWOOOWWWO..", "OWWWWWWWO...", "OOOOOOOO...."]
F_C = ["OOOOOOOO....", "OWWWWWWWO...", "OWWOOOWWO...", ".OWWWWWWWO..", ".OOOOOOOO..."]

FLAG = {
    "w": 16,
    "h": 26,
    "frames": [
        (flag(F_A), 0),
        (flag(F_B), 0),
        (flag(F_C), 0),
        (flag(F_B), 0),
        (flag(F_B), 0),
        (flag(F_C), 0),
        (flag(F_A), 0),
        (flag(F_C), 0),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# SMALL ROBOT — 14x20, hovers on a thruster
# ═══════════════════════════════════════════════════════════════════════════
def smallbot(eye, puff):
    return [
        "......K.......",
        ".....KGK......",
        "......K.......",
        "..KKKKKKKK....",
        "..KWWWWWWK....",
        "..KW" + eye + "WK....",
        "..KWWWWWWK....",
        "..KOOOOOOK....",
        "..KKKKKKKK....",
        "...K....K.....",
        "..KBK..KBK....",
        "..KKK..KKK....",
    ] + puff


SB_OPEN = "VGGV"
SB_HALF = "VVVV"
PUFF_A = ["...O....O.....", ".............."]
PUFF_B = ["...O....O.....", "....O..O......"]
PUFF_N = ["..............", ".............."]

SMALLBOT = {
    "w": 14,
    "h": 20,
    "frames": [
        (smallbot(SB_OPEN, PUFF_A), 1),
        (smallbot(SB_OPEN, PUFF_B), 2),
        (smallbot(SB_HALF, PUFF_A), 1),
        (smallbot(SB_OPEN, PUFF_N), 0),
        (smallbot(SB_OPEN, PUFF_B), 3),
        (smallbot(SB_HALF, PUFF_B), 4),
        (smallbot(SB_OPEN, PUFF_B), 3),
        (smallbot(SB_OPEN, PUFF_A), 1),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# BIG ROBOT — 20x28, stands still, blinks, raises both arms when poked
# ═══════════════════════════════════════════════════════════════════════════
def bigbot(eye, arms_up):
    head = [
        ".......KKKK.......",
        "......KKGGKK......",
        "....KKKKKKKKKK....",
        "....KWWWWWWWWK....",
        "....KW" + eye + "WK....",
        "....KW" + eye + "WK....",
        "....KWWWWWWWWK....",
        "....KKKKKKKKKK....",
        "......KWWWWK......",
    ]
    if arms_up:
        torso = [
            ".KWK.KOOOOOOK.KWK.",
            ".KWKKKOWWWWOKKKWK.",
            ".KBKKKOWVVWOKKKBK.",
            "..KKKKOWVVWOKKKK..",
            "...KKKOWWWWOKKK...",
            "...KKKOOOOOOKKK...",
        ]
    else:
        torso = [
            "...KKKOOOOOOKKK...",
            "...KWKOWWWWOKWK...",
            "...KWKOWVVWOKWK...",
            "...KWKOWVVWOKWK...",
            "...KBKOWWWWOKBK...",
            "...KKKOOOOOOKKK...",
        ]
    legs = [
        "....KWWWKKWWWK....",
        "....KWWKKKKWWK....",
        "....KWWK..KWWK....",
        "...KBBBK..KBBBK...",
        "...KKKKK..KKKKK...",
    ]
    return [r.center(20, ".") if len(r) < 20 else r for r in head + torso + legs]


BB_OPEN = "VVGGVV"
BB_SHUT = "VVVVVV"

BIGBOT = {
    "w": 20,
    "h": 28,
    "frames": [
        (bigbot(BB_OPEN, False), 0),
        (bigbot(BB_OPEN, False), 0),
        (bigbot(BB_SHUT, False), 0),
        (bigbot(BB_OPEN, False), 0),
        (bigbot(BB_OPEN, True), 0),
        (bigbot(BB_OPEN, True), 1),
        (bigbot(BB_SHUT, True), 1),
        (bigbot(BB_OPEN, True), 0),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# ROCKET — 22x38, landed; fires its thruster when poked
# ═══════════════════════════════════════════════════════════════════════════
def rocket(flame):
    body = [
        ".........KK.........",
        "........KOOK........",
        ".......KOWWOK.......",
        "......KWWWWWWK......",
        "......KWWWWWWK......",
        "......KWVVVVWK......",
        "......KWVGGVWK......",
        "......KWVVVVWK......",
        "......KWWWWWWK......",
        "......KOOOOOOK......",
        "......KWWWWWWK......",
        "......KWWWWWWK......",
        "......KOOOOOOK......",
        "....KKKWWWWWWKKK....",
        "...KOOKWWWWWWKOOK...",
        "..KOOOKWWWWWWKOOOK..",
        "..KOOKKWWWWWWKKOOK..",
        "..KKK.KKKKKKKK.KKK..",
    ]
    return [r.center(22, ".") for r in body] + [r.center(22, ".") for r in flame]


FL_NONE = []
FL_S = ["......KOOOOK......", ".......KOOK......."]
FL_M = ["......KOOOOK......", ".....KOOOOOOK.....", "......KOOOOK......", ".......KOK........"]
FL_L = [
    "......KOOOOK......",
    ".....KOOOOOOK.....",
    "....KOOOOOOOOK....",
    ".....KOOOOOOK.....",
    "......KOOOOK......",
    ".......KOK........",
]

ROCKET = {
    "w": 22,
    "h": 38,
    "frames": [
        (rocket(FL_NONE), 0),
        (rocket(FL_NONE), 0),
        (rocket(FL_S), 0),
        (rocket(FL_NONE), 0),
        (rocket(FL_S), 0),
        (rocket(FL_M), 0),
        (rocket(FL_L), 1),
        (rocket(FL_M), 0),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# TIMELINE GLYPHS — one per beat of the Then / Shift / Now strip
# ═══════════════════════════════════════════════════════════════════════════

# THEN — a floppy disk. The literal artefact of the handoff era.
def floppy(shutter, label):
    return [
        ".KKKKKKKKKKKKKK.",
        ".KWWWW" + shutter + "WWWWK.",
        ".KWWWWK" + label + "KWWWWK.",
        ".KWWWWK" + label + "KWWWWK.",
        ".KWWWWKKKKWWWWK.",
        ".KWWWWWWWWWWWWK.",
        ".KWWWWWWWWWWWWK.",
        ".KWWKKKKKKKKWWK.",
        ".KWWKOOOOOOKWWK.",
        ".KWWKOOOOOOKWWK.",
        ".KWWKOOOOOOKWWK.",
        ".KWWKKKKKKKKWWK.",
        ".KWWWWWWWWWWWWK.",
        ".KKKKKKKKKKKKKK.",
    ]


FLOPPY = {
    "w": 16,
    "h": 17,
    "frames": [
        (floppy("KKKK", "VV"), 0),
        (floppy("KKKK", "VV"), 0),
        (floppy("KKKK", "GV"), 0),
        (floppy("KKKK", "VV"), 0),
        (floppy("KKKK", "GG"), 1),
        (floppy("KKKK", "GG"), 3),
        (floppy("KKKK", "GV"), 2),
        (floppy("KKKK", "VV"), 0),
    ],
}

# THE SHIFT — a bolt. "AI changed how fast ideas become products."
BOLT = [
    "......KKK.....",
    ".....KOOK.....",
    "....KOOK......",
    "....KOOK......",
    "...KOOK.......",
    "...KOOKKKK....",
    "..KOOOOOOK....",
    "..KOOOOOK.....",
    "...KKKOOK.....",
    ".....KOOK.....",
    ".....KOK......",
    "....KOOK......",
    "....KOK.......",
    "...KOK........",
    "...KK.........",
]
BOLT_HOT = [r.replace("O", "G") for r in BOLT]
SPARKS = [
    "..............",
    "..............",
    "..............",
]
SPARKS_ON = [
    ".O..........O.",
    "..............",
    "...O......O...",
]

BOLT_GLYPH = {
    "w": 14,
    "h": 19,
    "frames": [
        (BOLT + SPARKS, 0),
        (BOLT + SPARKS, 0),
        (BOLT_HOT + SPARKS, 0),
        (BOLT + SPARKS, 0),
        (BOLT_HOT + SPARKS_ON, 0),
        (BOLT + SPARKS_ON, 1),
        (BOLT_HOT + SPARKS_ON, 0),
        (BOLT + SPARKS, 0),
    ],
}


# NOW — a rocket already off the pad. Deliberately not the CTA's landed one.
def liftoff(flame):
    body = [
        "......KK......",
        ".....KWWK.....",
        "....KWWWWK....",
        "....KWVVWK....",
        "....KWGGWK....",
        "....KWWWWK....",
        "....KOOOOK....",
        "....KWWWWK....",
        "..KKKWWWWKKK..",
        "..KOOKWWKOOK..",
        "..KOKKWWKKOK..",
        "..KK.KWWK.KK..",
        ".....KKKK.....",
    ]
    return body + flame


FL_A = ["....KOOOOK....", ".....KOOK.....", "......KK......"]
FL_B = ["....KOOOOK....", "...KOOOOOOK...", "....KOOOOK....", ".....KOK......"]
FL_C = ["...KOOOOOOK...", "..KOOOOOOOOK..", "...KOOOOOOK...", "....KOOOOK....", ".....KOK......"]

LIFTOFF = {
    "w": 14,
    "h": 24,
    "frames": [
        (liftoff(FL_A), 0),
        (liftoff(FL_B), 1),
        (liftoff(FL_A), 0),
        (liftoff(FL_B), 1),
        (liftoff(FL_B), 2),
        (liftoff(FL_C), 4),
        (liftoff(FL_C), 6),
        (liftoff(FL_B), 3),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# COMPARISON GLYPHS — one per column of the old-way / our-way table
# ═══════════════════════════════════════════════════════════════════════════

# "The product keeps almost launching." — a bar that fills to the brim and
# snaps back. The reaction frames take it further, then reset again: the point
# is the loop, not the progress.
def progress(fill):
    body = "O" * fill + "S" * (16 - fill)
    return [
        ".KKKKKKKKKKKKKKKKKK.",
        ".K" + body + "K.",
        ".K" + body + "K.",
        ".K" + body + "K.",
        ".KKKKKKKKKKKKKKKKKK.",
    ]


PROGRESS = {
    "w": 20,
    "h": 7,
    "frames": [
        (progress(12), 0),
        (progress(14), 0),
        (progress(15), 0),
        (progress(3), 0),
        (progress(15), 0),
        (progress(16), 1),
        (progress(2), 0),
        (progress(9), 0),
    ],
}

# "One focused sprint to something real." — a sealed crate with a check stamped
# on it. Something you can put your hands on, not another round of screens.
CHECK_OFF = ["......", "O...OO", ".O.OO.", "..OO.."]
CHECK_ON = [".....G", "G...GG", ".G.GG.", "..GG.."]


def parcel(check):
    return [
        "...KKKKKKKKKKKK...",
        "..KWWWWWWWWWWWWK..",
        "..KWWKKKKKKKKWWK..",
        "..KWWK" + check[0] + "KWWK..",
        "..KWWK" + check[1] + "KWWK..",
        "..KWWK" + check[2] + "KWWK..",
        "..KWWK" + check[3] + "KWWK..",
        "..KWWKKKKKKKKWWK..",
        "..KWWWWWWWWWWWWK..",
        "..KKKKKKKKKKKKKK..",
    ]


PARCEL = {
    "w": 18,
    "h": 14,
    "frames": [
        (parcel(CHECK_OFF), 0),
        (parcel(CHECK_OFF), 0),
        (parcel(CHECK_ON), 0),
        (parcel(CHECK_OFF), 0),
        (parcel(CHECK_ON), 1),
        (parcel(CHECK_ON), 3),
        (parcel(CHECK_ON), 2),
        (parcel(CHECK_OFF), 0),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# PROCESS GLYPHS — one per step of How we work
# ═══════════════════════════════════════════════════════════════════════════

# 01 Intake and direction — scattered input, funnelled into one stream.
def funnel(top, drip):
    return [
        top,
        "................",
        "KKKKKKKKKKKKKKKK",
        "KOOOOOOOOOOOOOOK",
        "KSSSSSSSSSSSSSSK",
        ".KSSSSSSSSSSSSK.",
        "..KSSSSSSSSSSK..",
        "...KSSSSSSSSK...",
        "....KSSSSSSK....",
        ".....KSSSSK.....",
        "......KSSK......",
        "......KSSK......",
        ".......KK.......",
    ] + drip


IN_A = "..O....O...O...."
IN_B = ".O...O....O..O.."
IN_C = "...O..O.O....O.."
DRIP_A = ["......OO........", "................"]
DRIP_B = ["................", ".......O........"]
DRIP_C = ["......OO........", ".......O........"]

FUNNEL = {
    "w": 16,
    "h": 15,
    "frames": [
        (funnel(IN_A, DRIP_A), 0),
        (funnel(IN_B, DRIP_B), 0),
        (funnel(IN_C, DRIP_A), 0),
        (funnel(IN_A, DRIP_B), 0),
        (funnel(IN_B, DRIP_C), 0),
        (funnel(IN_C, DRIP_C), 0),
        (funnel(IN_A, DRIP_C), 0),
        (funnel(IN_B, DRIP_A), 0),
    ],
}

# 02 Expert-led decisions — a pointer, and the click that settles it.
CURSOR = [
    "KK............",
    "KWK...........",
    "KWWK..........",
    "KWWWK.........",
    "KWWWWK........",
    "KWWWWWK.......",
    "KWWWWWWK......",
    "KWWWWWWWK.....",
    "KWWWWKKKKK....",
    "KWWKWWK.......",
    "KKK.KWWK......",
    ".....KWWK.....",
    "......KWK.....",
    ".......K......",
]
RING_OFF = ["..............", ".............."]
RING_SM = ["....O....O....", ".....OOOO....."]
RING_LG = ["..O........O..", "...OO....OO..."]

CURSOR_GLYPH = {
    "w": 14,
    "h": 17,
    "frames": [
        (CURSOR + RING_OFF, 0),
        (CURSOR + RING_OFF, 0),
        (CURSOR + RING_SM, 0),
        (CURSOR + RING_OFF, 0),
        (CURSOR + RING_SM, 0),
        (CURSOR + RING_LG, 0),
        (CURSOR + RING_SM, 1),
        (CURSOR + RING_OFF, 0),
    ],
}

# 03 Design and build in one loop — two lanes advancing in lockstep. Deliberately
# echoes the stalled bar in the comparison table: same form, opposite outcome.
def lockstep(fill):
    lane = "O" * fill + "S" * (14 - fill)
    return [
        "KKKKKKKKKKKKKKKK",
        "K" + lane + "K",
        "KKKKKKKKKKKKKKKK",
        "................",
        "KKKKKKKKKKKKKKKK",
        "K" + lane + "K",
        "KKKKKKKKKKKKKKKK",
    ]


MERGE = {
    "w": 16,
    "h": 8,
    "frames": [
        (lockstep(4), 0),
        (lockstep(7), 0),
        (lockstep(10), 0),
        (lockstep(13), 0),
        (lockstep(12), 0),
        (lockstep(14), 0),
        (lockstep(14), 1),
        (lockstep(13), 0),
    ],
}


# 01 Intake — a notebook. The messy brief before anything is decided.
def notebook(line3, pen):
    return [
        "..KKKKKKKKKKKKKK..",
        "..KWWWWWWWWWWWWK..",
        "..KWKKKKKKKKKKWK..",
        "..KWKOOOOOOOOKWK..",
        "..KWKWWWWWWWWKWK..",
        "..KWK" + line3 + "KWK..",
        "..KWKOOOOOOWWKWK..",
        "..KWKWWWWWWWWKWK..",
        "..KWKOOOOWWWWKWK..",
        "..KWKKKKKKKKKKWK..",
        "..KWWWWWWWWWWWWK..",
        "..KKKKKKKKKKKKKK..",
    ] + pen


NB_A = "OOOOOOWW"
NB_B = "OOOOOOOO"
PEN_A = ["..................", ".................."]
PEN_B = ["..............KG..", ".................."]
PEN_C = ["..............KG..", ".............KG..."]

NOTEBOOK = {
    "w": 18,
    "h": 15,
    "frames": [
        (notebook(NB_A, PEN_A), 0),
        (notebook(NB_B, PEN_A), 0),
        (notebook(NB_A, PEN_B), 0),
        (notebook(NB_B, PEN_A), 0),
        (notebook(NB_B, PEN_B), 0),
        (notebook(NB_B, PEN_C), 0),
        (notebook(NB_B, PEN_C), 1),
        (notebook(NB_A, PEN_B), 0),
    ],
}

# 03 Design and build in one loop — a computer, with something live on screen.
def computer(screen):
    return [
        "KKKKKKKKKKKKKKKK",
        "KWWWWWWWWWWWWWWK",
        "KWKKKKKKKKKKKKWK",
        "KWK" + screen[0] + "KWK",
        "KWK" + screen[1] + "KWK",
        "KWK" + screen[2] + "KWK",
        "KWK" + screen[3] + "KWK",
        "KWKKKKKKKKKKKKWK",
        "KWWWWWWWWWWWWWWK",
        "KKKKKKKKKKKKKKKK",
        "......KKKK......",
        "....KKKKKKKK....",
        "...KKKKKKKKKK...",
    ]


SC_A = ["VVOOOOVVVV", "VVVVVVVVVV", "VVOOOOOOVV", "VVOOVVVVVV"]
SC_B = ["VVOOOOOOVV", "VVVVVVVVVV", "VVOOOOOOVV", "VVOOOOVVVV"]
SC_C = ["VVGGGGGGVV", "VVVVVVVVVV", "VVGGGGGGVV", "VVGGGGVVVV"]

COMPUTER = {
    "w": 16,
    "h": 14,
    "frames": [
        (computer(SC_A), 0),
        (computer(SC_B), 0),
        (computer(SC_A), 0),
        (computer(SC_B), 0),
        (computer(SC_C), 0),
        (computer(SC_B), 1),
        (computer(SC_C), 1),
        (computer(SC_B), 0),
    ],
}


# 04 And loop — a ring with one marker going round it, forever.
RING = [
    ".....OOOOOO.....",
    "...OO......OO...",
    "..OO........OO..",
    ".OO..........OO.",
    ".OO..........OO.",
    "OO............OO",
    "OO............OO",
    "OO............OO",
    "OO............OO",
    ".OO..........OO.",
    ".OO..........OO.",
    "..OO........OO..",
    "...OO......OO...",
    ".....OOOOOO.....",
]
# (x, y) marker positions walking clockwise round the ring
MARKER = [(7, 0), (13, 2), (15, 7), (13, 11), (8, 13), (2, 11), (0, 7), (2, 2)]


def ring_at(x, y):
    rows = list(RING)
    r = list(rows[y])
    r[x] = "K"
    if x + 1 < len(r):
        r[x + 1] = "K"
    rows[y] = "".join(r)
    return rows


LOOP = {
    "w": 16,
    "h": 14,
    "frames": [(ring_at(x, y), 0) for (x, y) in MARKER],
}


# ═══════════════════════════════════════════════════════════════════════════
# UFO — 22x14, drifts across the top of the CTA. Drops a beam when poked.
# ═══════════════════════════════════════════════════════════════════════════
def ufo(lights, beam):
    return [
        ".......KKKKKKKK.......",
        ".....KKWWWWWWWWKK.....",
        "....KWWWVVVVVVWWWK....",
        "....KWWWWWWWWWWWWK....",
        "..KKKKKKKKKKKKKKKKKK..",
        ".KOOOOOOOOOOOOOOOOOOK.",
        "KO" + lights + "OK",
        ".KOOOOOOOOOOOOOOOOOOK.",
        "..KKKKKKKKKKKKKKKKKK..",
    ] + beam


L_A = "GOOGOOGOOGOOGOOGOO"
L_B = "OGOOGOOGOOGOOGOOGO"
L_C = "OOGOOGOOGOOGOOGOOG"
BEAM_OFF = []
BEAM_S = [".......OOOOOOOO......."]
BEAM_M = [".......OOOOOOOO.......", "......OOOOOOOOOO......"]
BEAM_L = [
    ".......OOOOOOOO.......",
    "......OOOOOOOOOO......",
    ".....OOOOOOOOOOOO.....",
]

UFO = {
    "w": 22,
    "h": 14,
    "frames": [
        (ufo(L_A, BEAM_OFF), 4),
        (ufo(L_B, BEAM_OFF), 5),
        (ufo(L_C, BEAM_OFF), 4),
        (ufo(L_B, BEAM_OFF), 3),
        (ufo(L_A, BEAM_S), 4),
        (ufo(L_C, BEAM_M), 3),
        (ufo(L_B, BEAM_L), 2),
        (ufo(L_A, BEAM_M), 3),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# CRAWLER — 16x14, side profile, walks sideways on three legs.
# Reaction frames are "held in a beam": legs retract and it hangs. The lift
# itself is CSS, so the sprite only has to sell the pose.
# ═══════════════════════════════════════════════════════════════════════════
def crawler(legs, antenna="G"):
    return [
        ".......K........",
        "......K" + antenna + "K.......",
        ".......K........",
        "..KKKKKKKKKKK...",
        "..KWWWWWWWWWK...",
        "..KWVVWWWWWWK...",
        "..KWVVWWWWWWK...",
        "..KWWWWWWWWWK...",
        "..KOOOOOOOOOK...",
        "..KKKKKKKKKKK...",
    ] + legs


LEGS_A = ["..K...K...K.....", ".KK...KK..KK...."]
LEGS_B = ["..K...K...K.....", "..KK...KK..KK..."]
LEGS_TUCK = ["...KK.KK.KK.....", "................"]
LEGS_HANG = ["..K...K...K.....", "..K...K...K....."]

CRAWLER = {
    "w": 16,
    "h": 14,
    "frames": [
        (crawler(LEGS_A), 0),
        (crawler(LEGS_B), 1),
        (crawler(LEGS_A), 0),
        (crawler(LEGS_B), 1),
        (crawler(LEGS_TUCK, "O"), 0),
        (crawler(LEGS_HANG, "O"), 0),
        (crawler(LEGS_TUCK, "O"), 0),
        (crawler(LEGS_HANG, "O"), 0),
    ],
}



# ═══════════════════════════════════════════════════════════════════════════
# WALKER — 24x30. Frames 0-3 walk in carrying a flag, 4-5 crouch to plant it,
# 6-7 are an empty-handed walk cycle that doubles as the standing pose. The
# switch is the planting: the carried flag leaves the sprite at exactly the
# moment the standalone flag rises in its place, and no frame from 4 onward has
# a pole in it.
# ═══════════════════════════════════════════════════════════════════════════
POLE = "K....."          # appended to every astronaut row: the pole at col 18
BANNER = [
    "..................KOOOOO",
    "..................KOWWWO",
    "..................KOOOOO",
    "..................K.....",
    "..................K.....",
]
NO_BANNER = ["." * 24] * 5

# the right arm reaches out to grip the pole
A_ARMS_CARRY = [
    "..KKKOOOOOOOOKKK..K.....",
    "..KWKOWWWWWWOKWWWWK.....",
    "..KWKOWWKKWWOKWK..K.....",
    "..KWKOWWKKWWOKWK..K.....",
    "..KBKOWWWWWWOKBK..K.....",
    "..KKKOOOOOOOOKKK..K.....",
]


def walker(head, arms, legs, carrying):
    top = BANNER if carrying else NO_BANNER
    tail = POLE if carrying else "......"
    body = [r + tail for r in head] + list(arms) + [r + tail for r in legs]
    return top + body


WALKER = {
    "w": 24,
    "h": 30,
    "frames": [
        (walker(A_HEAD, A_ARMS_CARRY, A_LEGS_APART, True), 0),
        (walker(A_HEAD, A_ARMS_CARRY, A_LEGS_TOGETHER, True), 1),
        (walker(A_HEAD, A_ARMS_CARRY, A_LEGS_APART, True), 0),
        (walker(A_HEAD, A_ARMS_CARRY, A_LEGS_TOGETHER, True), 1),
        # 4-5 crouch: the flag has left his hands, he is pushing it in
        (walker(A_HEAD, [r + "......" for r in A_ARMS_DOWN], A_LEGS_CROUCH, False), 0),
        (walker(A_HEAD, [r + "......" for r in A_ARMS_TUCK], A_LEGS_CROUCH, False), 0),
        # 6-7 back on his feet, empty handed. These double as the two-frame walk
        # cycle for stepping clear of the flag AND as the standing pose: frame 7
        # is legs-together arms-down, which is a rest, so `step` alternates 6/7
        # and `stand` just parks on 7. Without this the step phase had to reuse
        # frames 0-3 and he walked away still holding the flag he had planted.
        (walker(A_HEAD, [r + "......" for r in A_ARMS_L], A_LEGS_APART, False), 0),
        (walker(A_HEAD, [r + "......" for r in A_ARMS_DOWN], A_LEGS_TOGETHER, False), 0),
    ],
}


# ═══════════════════════════════════════════════════════════════════════════
# CARGO — 32x11, side profile, flies right to left. Cockpit leads, thrusters
# trail. The exhaust lives in the last five columns so the hull stays a fixed
# 27-wide block whatever the flame is doing.
# ═══════════════════════════════════════════════════════════════════════════
CARGO_HULL = [
    ".......KKKKKKKKKKKK........",
    "...KKKKWWWWWWWWWWWWKKKK....",
    ".KKWWWWWWWWWWWWWWWWWWWWKK..",
    "KWVVVWWWOOOOOOOOOOWWWWWWKK.",
    "KWVGGVWWOOOOOOOOOOWWWWWWKK.",
    "KWVVVWWWOOOOOOOOOOWWWWWWKK.",
    ".KKWWWWWWWWWWWWWWWWWWWWKK..",
    "...KKKKWWWWWWWWWWWWKKKK....",
    ".......KKKKKKKKKKKK........",
]
EX_OFF = ["....."] * 9
EX_A = ["....."] * 3 + ["OO...", "OOO..", "OO..."] + ["....."] * 3
EX_B = ["....."] * 3 + ["OOO..", "OOOO.", "OOO.."] + ["....."] * 3
EX_C = ["....."] * 2 + [".O...", "OOOO.", "OOOOO", "OOOO.", ".O..."] + ["....."] * 2


def cargo(exhaust):
    return [h + e for h, e in zip(CARGO_HULL, exhaust)]


CARGO = {
    "w": 32,
    "h": 11,
    "frames": [
        (cargo(EX_A), 0),
        (cargo(EX_B), 1),
        (cargo(EX_A), 0),
        (cargo(EX_B), 1),
        (cargo(EX_C), 0),
        (cargo(EX_B), 1),
        (cargo(EX_C), 0),
        (cargo(EX_OFF), 1),
    ],
}


CHARACTERS = {
    "astronaut": ASTRONAUT,
    "walker": WALKER,
    "cargo": CARGO,
    "ufo": UFO,
    "crawler": CRAWLER,
    "flag": FLAG,
    "smallbot": SMALLBOT,
    "bigbot": BIGBOT,
    "rocket": ROCKET,
    "progress": PROGRESS,
    "parcel": PARCEL,
    "funnel": FUNNEL,
    "cursor": CURSOR_GLYPH,
    "merge": MERGE,
    "loop": LOOP,
    "notebook": NOTEBOOK,
    "computer": COMPUTER,
    "floppy": FLOPPY,
    "bolt": BOLT_GLYPH,
    "liftoff": LIFTOFF,
}


def main():
    out = Path(__file__).resolve().parent.parent / "public" / "sprites"
    out.mkdir(parents=True, exist_ok=True)

    for name, spec in CHARACTERS.items():
        w, h, frames = spec["w"], spec["h"], spec["frames"]
        if len(frames) != FRAMES_PER_SHEET:
            raise SystemExit(f"{name}: {len(frames)} frames, expected {FRAMES_PER_SHEET}")
        variants = [("", PALETTE)]
        if name in ALSO_ON_DARK:
            variants.append(("-dark", PALETTE_ON_DARK))
        for suffix, pal in variants:
            sheet = Image.new("RGBA", (w * FRAMES_PER_SHEET, h), (0, 0, 0, 0))
            for n, (rows, lift) in enumerate(frames):
                for y, row in enumerate(pad(rows, w, h, lift)):
                    for x, ch in enumerate(row):
                        sheet.putpixel((n * w + x, y), pal[ch])
            sheet.save(out / f"{name}{suffix}.png")
            print(f"  {name + suffix:<14} {w}x{h} x8  ->  {sheet.width}x{sheet.height}")

    print(f"wrote {len(CHARACTERS)} sheets to {out}")


if __name__ == "__main__":
    main()
