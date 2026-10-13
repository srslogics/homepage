"""Read search-relevant content from the site's static, visitor-facing HTML."""
from dataclasses import dataclass, field
from html.parser import HTMLParser
from urllib.parse import urljoin


@dataclass
class Element:
    tag: str
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Element):
                yield from child.walk()

    def text(self):
        parts = []
        for child in self.children:
            if isinstance(child, str):
                parts.append(child)
            else:
                parts.append(child.text())
                if child.tag in {"br", "p", "li", "div"}:
                    parts.append(" ")
        return " ".join("".join(parts).split())


class Content(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Element("document")
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Element(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)

    def find(self, tag):
        return [node for node in self.root.walk() if node.tag == tag]

    def questions(self):
        faq_cards = {id(card) for section in self.find("section")
                     if section.attrs.get("id") == "frequently-asked-questions"
                     for card in section.walk() if card.tag == "article"}
        result, seen = [], set()
        for node in self.root.walk():
            if node.tag != "details" and id(node) not in faq_cards:
                continue
            heading_tag = "summary" if node.tag == "details" else "h3"
            heading = next((n.text() for n in node.walk() if n.tag == heading_tag), "")
            answer = " ".join(n.text() for n in node.walk() if n.tag == "p")
            if heading.endswith("?") and answer and heading not in seen:
                result.append((heading, answer))
                seen.add(heading)
        return result

    def services(self, canonical):
        result = []
        for node in self.root.walk():
            if "data-service" not in node.attrs:
                continue
            heading = next(n.text() for n in node.walk() if n.tag == "h3")
            description = next(n.text() for n in node.walk() if n.tag == "p")
            result.append({"@type": "Service", "@id": canonical + "#" + node.attrs["id"],
                           "name": heading, "description": description,
                           "url": canonical + "#" + node.attrs["id"]})
        return result

    def preview(self, canonical):
        image = next((n for n in self.find("img") if "data-search-image" in n.attrs), None)
        if image is None:
            return None
        attrs = image.attrs
        return {"url": urljoin(canonical, attrs["src"]), "width": attrs["width"],
                "height": attrs["height"], "alt": attrs["alt"]}
