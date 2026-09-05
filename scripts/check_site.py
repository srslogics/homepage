"""Check the static site's pages, local links, structured data, and galleries."""

import json
import re
import subprocess
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://srslogics.com"
VOID = set("area base br col embed hr img input link meta param source track wbr".split())


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.images = []
        self.galleries = []
        self.canonical = []
        self.h1 = 0
        self.redirect = False
        self.stack = []
        self.errors = []
        self.feed(source)
        if self.stack:
            self.errors.append(f"Unclosed tags: {self.stack}")
        for script in re.findall(r'<script\b([^>]*)>([\s\S]*?)</script>', source):
            if 'application/ld+json' in script[0]:
                json.loads(script[1])
            elif 'src=' not in script[0]:
                result = subprocess.run(
                    ["node", "--check"], input=script[1], text=True, capture_output=True
                )
                if result.returncode:
                    self.errors.append(result.stderr)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag not in VOID:
            self.stack.append(tag)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "refresh":
            self.redirect = True
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical.append(attrs["href"])
        if tag in ("a", "link") and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag in ("img", "script") and attrs.get("src"):
            self.links.append(attrs["src"])
        if tag == "img":
            self.images.append(attrs)
        if "data-images" in attrs:
            self.galleries.append(attrs)
            self.links.extend(attrs["data-images"].split("|"))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f"Unexpected closing tag: {tag}")
        else:
            self.stack.pop()


def main():
    files = subprocess.check_output(
        ["git", "ls-files", "*.html"], cwd=ROOT, text=True
    ).splitlines()
    pages = {file: Page((ROOT / file).read_text()) for file in files}
    failures = []
    link_count = 0
    for file, page in pages.items():
        failures.extend(f"{file}: {error}" for error in page.errors)
        if page.h1 != 1 and not page.redirect:
            failures.append(f"{file}: expected one h1, found {page.h1}")
        if len(page.canonical) != 1:
            failures.append(f"{file}: expected one canonical URL")
        for ident, count in Counter(page.ids).items():
            if count > 1:
                failures.append(f"{file}: duplicate id {ident}")
        for img in page.images:
            if "alt" not in img:
                failures.append(f"{file}: missing image alt")
        for gallery in page.galleries:
            if len(gallery["data-images"].split("|")) != len(gallery["data-captions"].split("|")):
                failures.append(f"{file}: gallery image/caption count mismatch")
        for link in page.links:
            url = urlsplit(urljoin(f"{ORIGIN}/{file}", link))
            if url.netloc != "srslogics.com" or url.scheme not in ("http", "https"):
                continue
            link_count += 1
            path = unquote(url.path).lstrip("/")
            target = ROOT / path
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                failures.append(f"{file}: missing local target {link}")
                continue
            rel = str(target.relative_to(ROOT))
            if url.fragment and rel in pages and unquote(url.fragment) not in pages[rel].ids:
                failures.append(f"{file}: missing anchor {link}")

    projects = pages["projects/index.html"]
    knp = next(g for g in projects.galleries if g["data-gallery-title"] == "KNP Signature")
    assert len(knp["data-images"].split("|")) == 8, "KNP gallery must retain all eight views"
    lakshya = (ROOT / "case-studies/lakshya-education-operations/index.html").read_text()
    assert "<img" not in lakshya.split("<main>")[1].split("</main>")[0], "Lakshya case study must stay image-free"
    for file in ROOT.glob("assets/js/*.js"):
        result = subprocess.run(["node", "--check", str(file)], text=True, capture_output=True)
        if result.returncode:
            failures.append(result.stderr)
    if failures:
        raise SystemExit("\n".join(failures))
    print(f"PASS: {len(pages)} pages; {link_count} local links/assets; HTML structure, JSON-LD, JavaScript syntax, image alternatives, and galleries.")


if __name__ == "__main__":
    main()
