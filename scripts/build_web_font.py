"""Losslessly package the existing licensed variable font for web delivery.

Requires fonttools[woff]; retains all characters, axes, and the source OFL.
"""
from pathlib import Path
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "assets/fonts/manrope-variable.ttf"
target = source.with_suffix(".woff2")
with TTFont(source, recalcTimestamp=False) as font:
    font.flavor = "woff2"
    font.save(target)
with TTFont(source) as original, TTFont(target) as compressed:
    assert original.getBestCmap() == compressed.getBestCmap()
    assert original.getGlyphOrder() == compressed.getGlyphOrder()
    assert original["fvar"].compile(original) == compressed["fvar"].compile(compressed)
print(f"Manrope: {source.stat().st_size:,} -> {target.stat().st_size:,} bytes")
