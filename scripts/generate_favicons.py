from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MASTER_SIZE = 1024


def lerp(start: int, end: int, amount: float) -> int:
    return round(start + (end - start) * amount)


def create_master() -> Image.Image:
    image = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    gradient = Image.new("RGBA", image.size)
    pixels = gradient.load()

    start = (16, 42, 70)
    end = (6, 16, 28)
    for y in range(MASTER_SIZE):
        for x in range(MASTER_SIZE):
            amount = (x + y) / (2 * (MASTER_SIZE - 1))
            pixels[x, y] = (
                lerp(start[0], end[0], amount),
                lerp(start[1], end[1], amount),
                lerp(start[2], end[2], amount),
                255,
            )

    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, MASTER_SIZE - 1, MASTER_SIZE - 1),
        radius=216,
        fill=255,
    )
    image.paste(gradient, (0, 0), mask)

    draw = ImageDraw.Draw(image)
    light_blue = (138, 217, 247, 255)
    blue = (78, 168, 216, 255)
    white = (237, 245, 252, 255)

    draw.line((152, 226, 392, 226), fill=light_blue, width=36)
    draw.line((632, 798, 872, 798), fill=blue, width=36)
    draw.ellipse((798, 180, 858, 240), fill=light_blue)
    draw.ellipse((176, 784, 216, 824), fill=blue)

    font = ImageFont.truetype(
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf", 340
    )
    draw.text(
        (MASTER_SIZE / 2, MASTER_SIZE / 2 + 42),
        "SrS",
        fill=white,
        font=font,
        anchor="mm",
        stroke_width=1,
    )
    return image


def save_png(master: Image.Image, path: Path, size: int) -> None:
    resized = master.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, "PNG", optimize=True)


def main() -> None:
    master = create_master()
    save_png(master, ROOT / "favicon-32x32.png", 32)
    save_png(master, ROOT / "apple-touch-icon.png", 180)
    save_png(master, ROOT / "favicon-192.png", 192)
    save_png(master, ROOT / "favicon-512.png", 512)
    save_png(master, ROOT / "assets/images/favicon-192.png", 192)

    icon_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = [master.resize(size, Image.Resampling.LANCZOS) for size in icon_sizes]
    ico_images[-1].save(
        ROOT / "favicon.ico",
        format="ICO",
        append_images=ico_images[:-1],
        sizes=icon_sizes,
    )


if __name__ == "__main__":
    main()
