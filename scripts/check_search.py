"""Check search metadata, discovery, content parity, and regional alternates."""
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

from sync_search_metadata import ROOT, ORIGIN, REGIONS, SCHEMA, company, sync


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.links = []
        self.title = []
        self.in_title = False
        self.detail = None
        self.field = None
        self.faq = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            key = attrs.get("name", attrs.get("property", ""))
            self.meta.setdefault(key, []).append(attrs.get("content", ""))
        if tag == "link":
            self.links.append(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "details":
            self.detail = {"summary": [], "p": []}
        if self.detail is not None and tag in ("summary", "p"):
            self.field = tag

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)
        if self.detail is not None and self.field:
            self.detail[self.field].append(data)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag in ("summary", "p"):
            self.field = None
        if tag == "details" and self.detail is not None:
            q = " ".join("".join(self.detail["summary"]).split())
            a = " ".join("".join(self.detail["p"]).split())
            if q.endswith("?") and a:
                self.faq.append((q, a))
            self.detail = None


def main():
    files = subprocess.check_output(["git", "ls-files", "*.html"], cwd=ROOT, text=True).splitlines()
    titles, descriptions, pages = [], [], {}
    for file in files:
        source = (ROOT / file).read_text()
        if 'http-equiv="refresh"' in source:
            continue
        page = Document(source)
        canonical = [x["href"] for x in page.links if x.get("rel") == "canonical"]
        expected = ORIGIN + "/" + file.removesuffix("index.html")
        assert canonical == [expected], f"{file}: canonical"
        assert source == sync(source), f"{file}: run sync_search_metadata.py"
        title = "".join(page.title)
        description = page.meta["description"]
        assert len(description) == 1 and description[0], f"{file}: description"
        assert page.meta["og:title"] == [title], f"{file}: social title"
        assert page.meta["og:description"] == description, f"{file}: social description"
        assert page.meta["og:url"] == canonical, f"{file}: social URL"
        assert len(page.meta["robots"]) == 1 and "noindex" not in page.meta["robots"][0], file
        nodes = [json.loads(m.group(1)) for m in SCHEMA.finditer(source)]
        organizations = [x for x in nodes if x.get("@id") == ORIGIN + "/#organization"]
        assert organizations == [company()], f"{file}: company identity"
        ids = [x["@id"] for x in nodes if "@id" in x]
        assert len(ids) == len(set(ids)), f"{file}: duplicate structured entities"
        faq_nodes = [x for x in nodes if x.get("@type") == "FAQPage"]
        schema_faq = [(q["name"], q["acceptedAnswer"]["text"]) for n in faq_nodes for q in n["mainEntity"]]
        assert schema_faq == page.faq, f"{file}: FAQ text not visible or out of sync"
        for node in nodes:
            assert node.get("@type") not in ("AggregateRating", "Review"), f"{file}: no invented ratings"
        pages[expected] = page
        titles.append(title)
        descriptions.append(description[0])
    assert all(n == 1 for n in Counter(titles).values()), "Duplicate titles"
    assert all(n == 1 for n in Counter(descriptions).values()), "Duplicate descriptions"
    # Independently protect the public company identity, not just generator parity.
    identity = company()
    assert set(identity["sameAs"]) == {
        "https://www.linkedin.com/company/ss49d1t1tech/",
        "https://www.instagram.com/ss49tech/",
        "https://share.google/ye9MjSSmT0RUikH2d",
    }, "Company profiles must not be confused with founder profiles"
    about = (ROOT / "about/index.html").read_text()
    visible_about = about.split("<main>", 1)[1].split("</main>", 1)[0]
    assert identity["description"] in visible_about, "Company description must be visible"
    assert identity["legalName"] in visible_about, "Legal identity must be visible"
    assert len(pages[ORIGIN + "/about/"].faq) >= 5, "Company answers missing"
    for profile in identity["sameAs"]:
        assert f'href="{profile}"' in visible_about, "Official profile must be visible"
    for path in REGIONS.values():
        actual = {x["hreflang"]: x["href"] for x in pages[ORIGIN + path].links if "hreflang" in x}
        assert actual == {k: ORIGIN + v for k, v in REGIONS.items()}, f"{path}: reciprocal hreflang"
    sitemap = ET.parse(ROOT / "sitemap.xml")
    urls = [x.text for x in sitemap.findall("{*}url/{*}loc")]
    assert set(urls) == set(pages) and len(urls) == len(pages), "Sitemap coverage or duplicates"
    for url in urls:
        assert urlsplit(url).netloc == "ss49d1t1tech.in", url
    assert f"Sitemap: {ORIGIN}/sitemap.xml" in (ROOT / "robots.txt").read_text()
    # Supplementary briefs must cite real pages, not invented discovery routes.
    for file in ("llms.txt", "llms-full.txt"):
        for url in re.findall(r'https://ss49d1t1tech\.in/[^\s)<>]*', (ROOT / file).read_text()):
            url = url.rstrip(".,").split("#")[0]
            assert url in pages, f"{file}: unknown source {url}"
    print(f"PASS: {len(pages)} pages; unique metadata, company identity, visible FAQ parity, reciprocal regional links, sitemap coverage, and brief sources.")


if __name__ == "__main__":
    main()
