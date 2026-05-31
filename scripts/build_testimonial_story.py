from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


WIDTH = 1080
HEIGHT = 1920
OUT_DIR = Path("/Users/shubhamsingh/Documents/New project/homepage/artifacts/testimonial-reel")

FONT_SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf"
FONT_SERIF_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
FONT_SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"

BG_TOP = (8, 14, 27)
BG_BOTTOM = (17, 13, 35)
GRID = (34, 46, 77, 34)
CARD_FILL = (249, 247, 255)
CARD_BORDER = (92, 75, 116, 35)
CARD_SHADOW = (1, 3, 9, 80)
TEXT_PRIMARY = (34, 24, 48)
TEXT_SECONDARY = (78, 62, 100)
ACCENT = (170, 240, 255)
PLUM = (43, 28, 61)

TESTIMONIALS = [
    {
        "slug": "knp",
        "quote": (
            "We are genuinely very happy with this software. Earlier, a lot of work had to be managed manually, "
            "which created confusion and took extra time. Now billing, stock, payments, and balances all feel "
            "much more clear and under control. It has made our daily business work smoother and given us much "
            "more confidence in managing everything properly."
        ),
        "author": "Sandeep Singh Alag",
        "role": "Owner, KNP Enterprises",
    },
    {
        "slug": "utsav",
        "quote": (
            "SRS Logics developed both our website and poultry operations application with a clear understanding "
            "of our business. The platform now supports farmer reporting, feed and health tracking, document "
            "management, cost and sales entry, and owner-side monitoring. We are very happy with the overall "
            "work and the practical value it has brought to our operations."
        ),
        "author": "Vikesh Agrawal",
        "role": "Owner, Utsav Feed Industries",
    },
    {
        "slug": "royal",
        "quote": (
            "This platform has completely changed how Royal Celebration is presented and managed. Our website "
            "now gives guests a premium first impression, and the software helps us handle enquiries, bookings, "
            "hotel stays, vendors, and payments with much more clarity and control. It feels like a serious "
            "upgrade for our business."
        ),
        "author": "Manoj Singh",
        "role": "Owner, Royal Celebration and Temptation Restaurant",
    },
]


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def draw_gradient(img: Image.Image) -> None:
    draw = ImageDraw.Draw(img)
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        color = tuple(int(BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t) for i in range(3))
        draw.line((0, y, WIDTH, y), fill=color)

    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    o_draw = ImageDraw.Draw(overlay)
    o_draw.ellipse((-120, 180, 420, 760), fill=(38, 84, 154, 42))
    o_draw.ellipse((700, -40, 1260, 560), fill=(93, 65, 150, 52))
    o_draw.ellipse((780, 1360, 1360, 1980), fill=(65, 126, 190, 30))
    overlay = overlay.filter(ImageFilter.GaussianBlur(60))
    img.alpha_composite(overlay)


def draw_grid(img: Image.Image) -> None:
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    step = 72
    for x in range(0, WIDTH, step):
        d.line((x, 0, x, HEIGHT), fill=GRID, width=1)
    for y in range(0, HEIGHT, step):
        d.line((0, y, WIDTH, y), fill=GRID, width=1)
    img.alpha_composite(overlay)


def rounded_rectangle(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrap_text(draw, text, font, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = word if not current else f"{current} {word}"
        if draw.textlength(test, font=font) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def make_slide(data, index, total):
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_TOP + (255,))
    draw_gradient(img)
    draw_grid(img)

    draw = ImageDraw.Draw(img)
    serif_title = load_font(FONT_SERIF_BOLD, 76)
    sans_small = load_font(FONT_SANS, 28)
    sans_label = load_font(FONT_SANS, 26)
    sans_body = load_font(FONT_SANS, 42)
    sans_author = load_font(FONT_SANS, 34)

    # Header
    draw.line((110, 120, 185, 120), fill=ACCENT, width=3)
    draw.text((215, 101), "SRS LOGICS", font=sans_small, fill=(227, 235, 255), spacing=1)
    draw.text((110, 166), "CLIENT TESTIMONIALS", font=sans_label, fill=(157, 177, 212))

    counter_box = (864, 88, 970, 150)
    rounded_rectangle(draw, counter_box, 30, fill=(255, 255, 255, 18), outline=(166, 190, 233, 35), width=2)
    draw.text((896, 104), f"{index:02d}/{total:02d}", font=sans_small, fill=(224, 232, 250))

    # Title
    draw.text((110, 246), "What clients say", font=serif_title, fill=(240, 245, 255))

    # Card shadow
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle((95, 420, 985, 1550), radius=46, fill=CARD_SHADOW)
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    img.alpha_composite(shadow)

    # Card
    rounded_rectangle(draw, (105, 400, 975, 1530), 42, fill=CARD_FILL, outline=CARD_BORDER, width=2)

    # Quote mark
    quote_font = load_font(FONT_SERIF_BOLD, 150)
    draw.text((160, 462), "“", font=quote_font, fill=(231, 225, 245))

    # Quote text
    lines = wrap_text(draw, data["quote"], sans_body, 690)
    y = 580
    for line in lines:
        draw.text((160, y), line, font=sans_body, fill=TEXT_PRIMARY)
        y += 58

    # Author block
    rounded_rectangle(draw, (150, 1280, 930, 1455), 30, fill=PLUM, outline=(65, 49, 88, 40), width=2)
    draw.text((190, 1320), data["author"], font=sans_author, fill=(245, 248, 255))
    draw.text((190, 1374), data["role"], font=sans_small, fill=(198, 211, 236))

    # Footer note
    rounded_rectangle(draw, (110, 1645, 975, 1785), 28, fill=(34, 24, 48), outline=(166, 190, 233, 28), width=2)
    draw.text((150, 1676), "Custom software systems built around real business operations.", font=sans_small, fill=(226, 236, 255))

    return img.convert("RGB")


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    slides = []
    for idx, item in enumerate(TESTIMONIALS, start=1):
        slide = make_slide(item, idx, len(TESTIMONIALS))
        slide_path = OUT_DIR / f"story-{idx:02d}-{item['slug']}.png"
        slide.save(slide_path, quality=95)
        slides.append(slide)

    gif_path = OUT_DIR / "SRS_Logics_Testimonial_Story.gif"
    slides[0].save(
        gif_path,
        save_all=True,
        append_images=slides[1:],
        duration=[2500, 2500, 2500],
        loop=0,
        optimize=True,
    )


if __name__ == "__main__":
    build()
