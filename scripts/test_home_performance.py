"""Static regression checks for homepage loading priorities and stability."""

from html.parser import HTMLParser
from pathlib import Path
import unittest

from build_home_css import OUTPUT, build
from sync_search_metadata import sync

ROOT = Path(__file__).resolve().parents[1]


class Elements(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class HomepagePerformanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text()
        cls.tags = Elements(cls.html).tags
        cls.css = build()

    def test_generated_styles_are_current(self):
        self.assertEqual(OUTPUT.read_text(), self.css)
        self.assertNotIn("@import", self.css)

    def test_metadata_sync_preserves_loading_order(self):
        self.assertEqual(sync(self.html), self.html)

    def test_single_stylesheet_and_early_font_preload(self):
        styles = [(i, a) for i, (t, a) in enumerate(self.tags)
                  if t == "link" and a.get("rel") == "stylesheet"]
        self.assertEqual(len(styles), 1)
        self.assertTrue(styles[0][1]["href"].startswith("assets/css/home.css?"))
        fonts = [(i, a) for i, (t, a) in enumerate(self.tags)
                 if t == "link" and a.get("as") == "font"]
        self.assertEqual(len(fonts), 1)
        self.assertLess(fonts[0][0], styles[0][0])
        self.assertIn("crossorigin", fonts[0][1])
        self.assertIn("font-display: optional;", self.css)

    def test_homepage_does_not_load_ads(self):
        self.assertNotIn("adsbygoogle", self.html)
        self.assertNotIn("pagead2.googlesyndication.com", self.html)

    def test_project_images_reserve_space_and_load_lazily(self):
        images = [a for t, a in self.tags if t == "img"]
        self.assertGreater(len(images), 0)
        for image in images:
            with self.subTest(src=image.get("src")):
                self.assertGreater(int(image["width"]), 0)
                self.assertGreater(int(image["height"]), 0)
                self.assertEqual(image.get("loading"), "lazy")
                self.assertNotEqual(image.get("fetchpriority"), "high")

    def test_hero_is_not_hidden_behind_entrance_animation(self):
        self.assertNotIn("enterprise-enter", self.css)
        self.assertIn(
            ".enterprise-intro h1, .enterprise-intro-copy, .hero-index { animation: none; }",
            self.css,
        )


if __name__ == "__main__":
    unittest.main()
