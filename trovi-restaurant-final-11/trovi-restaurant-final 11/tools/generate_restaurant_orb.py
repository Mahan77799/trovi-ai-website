#!/usr/bin/env python3
"""Generate Trovi's original pre-rendered liquid-glass restaurant orb.

The site embeds the resulting animation as a small WebP background image. The
glass rim and highlights remain visually anchored while the blue and champagne
current advances toward the bottom of the sphere and then recedes.
"""

from pathlib import Path
import math

import numpy as np
from PIL import Image, ImageDraw


SIZE = 400
FRAME_COUNT = 60
FRAME_MS = 200  # 12-second seamless loop
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "assets" / "planets"


def smoothstep(edge0, edge1, value):
    scaled = np.clip((value - edge0) / (edge1 - edge0), 0.0, 1.0)
    return scaled * scaled * (3.0 - 2.0 * scaled)


def mix(a, b, amount):
    return a * (1.0 - amount[..., None]) + b * amount[..., None]


def render_frame(frame_index):
    axis = np.linspace(-1.0, 1.0, SIZE, dtype=np.float32)
    x, y = np.meshgrid(axis, axis)
    radius = np.sqrt(x * x + y * y)
    phase = (frame_index / FRAME_COUNT) * math.tau

    # One calm tide: advance toward the bottom, pause softly, then recede.
    tide = 0.5 - 0.5 * math.cos(phase)
    centre = -0.095 + 0.19 * tide
    edge_weight = np.clip(1.0 - x * x, 0.0, 1.0)
    wave = (
        0.034 * np.sin(2.55 * x + 0.42 * math.sin(phase))
        + 0.014 * np.sin(6.2 * x - 0.55 * math.sin(phase))
    ) * edge_weight
    fold = 0.016 * np.sin(phase + 3.25 * x) * edge_weight
    current_centre = centre + wave + fold
    lens = np.sqrt(np.clip(1.0 - np.square(x / 0.96), 0.0, 1.0))
    thickness = 0.055 + 0.245 * lens
    thickness += 0.018 * np.sin(phase - 2.6 * x) * edge_weight
    upper_edge = current_centre - thickness * 0.52
    lower_edge = current_centre + thickness * 0.48

    # Crisp liquid boundaries. Only a narrow antialiased transition is used.
    transition = 0.022
    into_gold = smoothstep(upper_edge - transition, upper_edge + transition, y)
    out_of_gold = smoothstep(lower_edge - transition, lower_edge + transition, y)
    gold_mask = into_gold * (1.0 - out_of_gold)

    top_deep = np.array([28, 143, 216], dtype=np.float32)
    top_light = np.array([119, 202, 235], dtype=np.float32)
    top_mix = np.clip((y + 1.0) * 0.44 + 0.12 * (x + 1.0), 0.0, 1.0)
    top_colour = mix(
        np.broadcast_to(top_deep, (SIZE, SIZE, 3)),
        np.broadcast_to(top_light, (SIZE, SIZE, 3)),
        top_mix,
    )

    lower_silver = np.array([219, 230, 225], dtype=np.float32)
    lower_blue = np.array([89, 177, 217], dtype=np.float32)
    lower_mix = np.clip((y + 0.15) * 0.72 + 0.08 * np.sin(2.0 * x), 0.0, 1.0)
    lower_colour = mix(
        np.broadcast_to(lower_silver, (SIZE, SIZE, 3)),
        np.broadcast_to(lower_blue, (SIZE, SIZE, 3)),
        lower_mix,
    )

    gold_cream = np.array([255, 250, 232], dtype=np.float32)
    gold_champagne = np.array([232, 192, 112], dtype=np.float32)
    band_position = np.clip((y - upper_edge) / np.maximum(lower_edge - upper_edge, 0.001), 0.0, 1.0)
    gold_mix = np.clip(0.08 + 0.72 * np.abs(band_position - 0.48) * 1.55 + 0.07 * np.sin(3.0 * x + phase), 0.0, 1.0)
    gold_colour = mix(
        np.broadcast_to(gold_cream, (SIZE, SIZE, 3)),
        np.broadcast_to(gold_champagne, (SIZE, SIZE, 3)),
        gold_mix,
    )

    liquid = mix(top_colour, gold_colour, into_gold)
    liquid = mix(liquid, lower_colour, out_of_gold)

    # A narrow refracted shoreline makes the wave legible without blurring it.
    upper_caustic = np.exp(-np.square((y - upper_edge) / 0.025)) * 0.24
    lower_caustic = np.exp(-np.square((y - lower_edge) / 0.028)) * 0.20
    centre_caustic = np.exp(-np.square((y - current_centre) / 0.018)) * 0.42
    caustic = np.clip((upper_caustic + lower_caustic + centre_caustic) * (0.72 + 0.28 * edge_weight), 0.0, 0.52)
    liquid = mix(liquid, np.full_like(liquid, 255.0), caustic)

    # A slowly folding blue tongue prevents the gold from reading as a flat band.
    tongue_x = -0.34 + 0.22 * math.sin(phase)
    tongue_y = current_centre + 0.01
    tongue = np.exp(-(((x - tongue_x) / 0.33) ** 2 + ((y - tongue_y) / 0.060) ** 2))
    tongue *= gold_mask * 0.12
    liquid = mix(liquid, top_light[None, None, :], tongue)

    # Curved internal refraction lines echo the liquid chambers.
    top_arc_y = upper_edge - (0.115 + 0.055 * lens)
    lower_arc_y = lower_edge + (0.125 + 0.052 * lens)
    top_arc = np.exp(-np.square((y - top_arc_y) / 0.011)) * 0.20 * edge_weight
    lower_arc = np.exp(-np.square((y - lower_arc_y) / 0.012)) * 0.27 * edge_weight
    liquid = mix(liquid, np.full_like(liquid, 255.0), np.clip(top_arc + lower_arc, 0.0, 0.34))

    # Convex lens lighting: bright upper-left, subtly deeper lower-right.
    diffuse = np.clip(1.04 - 0.13 * (0.42 * x + 0.58 * y) - 0.07 * radius * radius, 0.78, 1.12)
    liquid *= diffuse[..., None]
    specular = np.exp(-(((x + 0.36) / 0.42) ** 2 + ((y + 0.54) / 0.13) ** 2)) * 0.18
    liquid = mix(liquid, np.full_like(liquid, 255.0), specular)

    # Stationary glass rim built into the original asset.
    rim_zone = smoothstep(0.905, 0.968, radius)
    outer_blue = np.array([164, 210, 232], dtype=np.float32)
    liquid = mix(liquid, np.broadcast_to(outer_blue, liquid.shape), rim_zone * 0.39)
    white_ring = np.exp(-np.square((radius - 0.930) / 0.008)) * 0.44
    cyan_ring = np.exp(-np.square((radius - 0.973) / 0.010)) * 0.35
    liquid = mix(liquid, np.full_like(liquid, 255.0), white_ring)
    liquid = mix(liquid, np.broadcast_to(np.array([111, 196, 229], dtype=np.float32), liquid.shape), cyan_ring)

    # Fine anchored highlights following the spherical edge.
    angle = np.arctan2(y, x)
    left_arc = np.exp(-np.square((radius - 0.894) / 0.009))
    left_arc *= smoothstep(0.25, 0.75, np.cos(angle + 2.35)) * 0.52
    liquid = mix(liquid, np.full_like(liquid, 255.0), left_arc)
    lower_shadow = np.exp(-np.square((radius - 0.90) / 0.032))
    lower_shadow *= smoothstep(0.15, 0.85, (x + y + 2.0) / 4.0) * 0.11
    liquid *= (1.0 - lower_shadow[..., None])

    alpha = 1.0 - smoothstep(0.982, 1.0, radius)
    rgba = np.dstack((np.clip(liquid, 0, 255), np.clip(alpha * 255.0, 0, 255))).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def save_contact_sheet(frames):
    picks = [0, FRAME_COUNT // 4, FRAME_COUNT // 2, (FRAME_COUNT * 3) // 4]
    sheet = Image.new("RGBA", (SIZE * 4, SIZE), (248, 248, 244, 255))
    for slot, frame_index in enumerate(picks):
        sheet.alpha_composite(frames[frame_index], (slot * SIZE, 0))
    draw = ImageDraw.Draw(sheet)
    for slot, label in enumerate(("start", "advance", "shore", "recede")):
        draw.rounded_rectangle((slot * SIZE + 14, 14, slot * SIZE + 90, 42), 11, fill=(255, 255, 255, 218))
        draw.text((slot * SIZE + 26, 21), label, fill=(28, 31, 32, 255))
    sheet.save(OUTPUT_DIR / "restaurant-wave-contact-sheet.png")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = [render_frame(i) for i in range(FRAME_COUNT)]
    frames[0].save(
        OUTPUT_DIR / "restaurant-wave-animated.webp",
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_MS,
        loop=0,
        quality=88,
        method=4,
        minimize_size=False,
    )
    frames[0].save(OUTPUT_DIR / "restaurant-wave-still.webp", quality=94, method=6)
    save_contact_sheet(frames)


if __name__ == "__main__":
    main()
