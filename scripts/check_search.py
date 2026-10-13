"""Check search metadata, discovery, content parity, and regional alternates."""
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urldefrag

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
        self.faq_sections = []
        self.question_tag = None
        self.anchors = []
        self.headings = []
        self.heading = None
        self.services = []
        self.service = None
        self.service_tag = None
        self.service_field = None
        self.images = []
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
        if tag == "a" and "href" in attrs:
            self.anchors.append(attrs["href"])
        if tag == "img":
            self.images.append(attrs)
        if tag == "h1":
            self.heading = []
        if "data-service" in attrs:
            self.service = {"id": attrs["id"], "h3": [], "p": []}
            self.service_tag = tag
        if self.service is not None and tag in ("h3", "p"):
            self.service_field = tag
        if tag == "section":
            self.faq_sections.append(attrs.get("id") == "frequently-asked-questions")
        if tag == "details" or (tag == "article" and any(self.faq_sections)):
            self.detail = {"summary": [], "p": []}
            self.question_tag = tag
        if self.detail is not None and tag in ("summary", "h3", "p"):
            self.field = "summary" if tag == "h3" else tag
        if tag == "br":
            self.handle_data(" ")

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)
        if self.detail is not None and self.field:
            self.detail[self.field].append(data)
        if self.heading is not None:
            self.heading.append(data)
        if self.service is not None and self.service_field:
            self.service[self.service_field].append(data)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "h1":
            self.headings.append(" ".join("".join(self.heading).split()))
            self.heading = None
        if tag == "section" and self.faq_sections:
            self.faq_sections.pop()
        if tag == "p":
            self.handle_data(" ")
        if tag in ("summary", "h3", "p"):
            self.field = None
            self.service_field = None
        if tag == self.question_tag and self.detail is not None:
            q = " ".join("".join(self.detail["summary"]).split())
            a = " ".join("".join(self.detail["p"]).split())
            if q.endswith("?") and a and not any(q == item[0] for item in self.faq):
                self.faq.append((q, a))
            self.detail = None
            self.question_tag = None
        if tag == self.service_tag and self.service is not None:
            self.services.append({key: " ".join("".join(value).split()) if isinstance(value, list) else value
                                  for key, value in self.service.items()})
            self.service = None
            self.service_tag = None


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def main():
    files = subprocess.check_output(["git", "ls-files", "*.html"], cwd=ROOT, text=True).splitlines()
    titles, descriptions, pages = [], [], {}
    for file in files:
        source = (ROOT / file).read_text()
        if 'http-equiv="refresh"' in source:
            continue
        page = Document(source)
        assert len(page.headings) == 1 and page.headings[0], f"{file}: exactly one main heading"
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
        definitions = [x for x in walk(nodes) if x.get("@id") == ORIGIN + "/#organization" and "@type" in x]
        assert definitions == organizations, f"{file}: conflicting nested company definitions"
        ids = [x["@id"] for x in nodes if "@id" in x]
        assert len(ids) == len(set(ids)), f"{file}: duplicate structured entities"
        faq_nodes = [x for x in nodes if x.get("@type") == "FAQPage"]
        schema_faq = [(q["name"], q["acceptedAnswer"]["text"]) for n in faq_nodes for q in n["mainEntity"]]
        assert schema_faq == page.faq, f"{file}: FAQ text not visible or out of sync"
        catalogs = [n for n in nodes if n.get("@type") == "OfferCatalog"]
        if page.services:
            assert len(catalogs) == 1, f"{file}: service catalog missing"
            actual = [x["itemOffered"] for x in catalogs[0]["itemListElement"]]
            assert [(x["name"], x["description"], x["url"]) for x in actual] == [
                (x["h3"], x["p"], expected + "#" + x["id"]) for x in page.services], f"{file}: visible service parity"
        for node in walk(nodes):
            assert node.get("@type") not in ("AggregateRating", "Review"), f"{file}: no invented ratings"
            if node.get("@type") == "Article":
                assert node["headline"] == page.headings[0], f"{file}: article headline drift"
                assert node["description"] == description[0], f"{file}: article description drift"
                assert node["image"] == page.meta["og:image"][0], f"{file}: article image drift"
        for image in page.meta["og:image"]:
            assert urlsplit(image).netloc == "ss49d1t1tech.in", f"{file}: image origin"
            assert (ROOT / urlsplit(image).path.lstrip("/")).is_file(), f"{file}: missing preview image"
        preload = [x for x in page.links if x.get("as") == "font"]
        assert len(preload) == 1 and preload[0].get("type") == "font/woff2", f"{file}: font preload"
        assert "crossorigin" in preload[0], f"{file}: font preload must match font CORS mode"
        pages[expected] = page
        titles.append(title)
        descriptions.append(description[0])
    assert all(n == 1 for n in Counter(titles).values()), "Duplicate titles"
    assert all(n == 1 for n in Counter(descriptions).values()), "Duplicate descriptions"
    reachable, pending = set(), [ORIGIN + "/"]
    while pending:
        url = pending.pop()
        if url in reachable:
            continue
        reachable.add(url)
        for href in pages[url].anchors:
            destination = urldefrag(urljoin(url, href))[0]
            if destination in pages and destination not in reachable:
                pending.append(destination)
    assert reachable == set(pages), f"Orphan pages: {set(pages) - reachable}"
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
    print(f"PASS: {len(pages)} pages; unique metadata, company identity, visible FAQ/service/article parity, font preloads, reciprocal regional links, crawl paths, sitemap coverage, and brief sources.")


if __name__ == "__main__":
    main()
