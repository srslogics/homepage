"""Regenerate website assets from the approved SS49 artwork, not a legacy mark."""

from pathlib import Path
import subprocess


if __name__ == "__main__":
    subprocess.run(
        ["node", str(Path(__file__).with_name("build_brand_assets.cjs"))],
        check=True,
    )
