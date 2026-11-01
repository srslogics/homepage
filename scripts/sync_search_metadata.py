"""Sync static metadata from visible content; --check never writes files.

Does not generate dates, reviews, commercial claims, or new landing pages.
"""
import argparse
import html
import json
import re
import subprocess
from pathlib import Path
from search_content import Content

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://ss49d1t1tech.in"
BRAND = "SS49 D1T1TECH"
LEGAL = "SS49 D1T1TECH (OPC) PRIVATE LIMITED"
IMAGE = ORIGIN + "/assets/brand/ss49-mark.png?v=20261007-share"
FONT = "/assets/fonts/manrope-variable.woff2"
SCHEMA = re.compile(r'<script type="application/ld\+json">([\s\S]*?)</script>')
REGIONS = {"en-US": "/us/", "en-GB": "/uk/", "en-AE": "/uae/", "x-default": "/regions/"}


def plain(value):
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    return " ".join(html.unescape(re.sub(r"<[^>]+>", "", value)).split())


def questions(source):
    return [{"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in Content(source).questions()]


def company_references(value):
    # One complete company definition per page; nested uses refer to that entity.
    if isinstance(value, dict):
        if value.get("@id") == ORIGIN + "/#organization":
            return {"@id": value["@id"]}
        return {key: company_references(child) for key, child in value.items()}
    if isinstance(value, list):
        return [company_references(child) for child in value]
    return value


def company():
    return {"@context": "https://schema.org", "@type": "Organization",
            "@id": ORIGIN + "/#organization", "name": LEGAL, "legalName": LEGAL,
            "alternateName": ["SS49", BRAND, "SS49 Tech"], "url": ORIGIN + "/",
            "description": "SS49 D1T1TECH is a custom software development company based in Nagpur, Maharashtra, India. We build applications, connected business systems, and digital products across industries.",
            "logo": ORIGIN + "/assets/brand/ss49-mark.png",
            "sameAs": ["https://www.instagram.com/ss49tech/",
                       "https://www.linkedin.com/company/ss49d1t1tech/",
                       "https://share.google/ye9MjSSmT0RUikH2d",
                       "https://clutch.co/profile/ss49-d1t1tech-opc-private",
                       "https://www.goodfirms.co/company/ss49-d1t1tech-opc-private-limited"],
            "email": "founder@ss49d1t1tech.in", "telephone": "+91-9270925106",
            "founder": {"@id": ORIGIN + "/about/#founder"},
            "address": {"@type": "PostalAddress", "addressLocality": "Nagpur",
                        "addressRegion": "Maharashtra", "addressCountry": "IN"},
            "areaServed": ["India", "United Arab Emirates", "United Kingdom", "United States"]}


def sync(source):
    if re.search(r'http-equiv="refresh"', source, re.I):
        return source
    # Keep verified company profiles visible alongside their structured identity.
    def social_footer(match):
        footer = match.group(0)
        if 'https://www.linkedin.com/company/ss49d1t1tech/' not in footer:
            footer = re.sub(
                r'(<li><a href="https://www.instagram.com/ss49tech/"[^>]*>.*?</a></li>)',
                r'\1\n            <li><a href="https://www.linkedin.com/company/ss49d1t1tech/" target="_blank" rel="noopener">LinkedIn</a></li>',
                footer)
        if 'https://share.google/ye9MjSSmT0RUikH2d' not in footer:
            footer = re.sub(
                r'(<li><a href="https://www.linkedin.com/company/ss49d1t1tech/"[^>]*>.*?</a></li>)',
                r'\1\n            <li><a href="https://share.google/ye9MjSSmT0RUikH2d" target="_blank" rel="noopener">Google Business Profile</a></li>',
                footer)
        return footer
    source = re.sub(r'<footer\b[\s\S]*?</footer>', social_footer, source)
    if '<meta name="robots"' not in source:
        source = source.replace('</head>', '  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">\n</head>')
    title = plain(re.search(r"<title>(.*?)</title>", source).group(1))
    description = html.unescape(re.search(r'<meta name="description" content="([^"]+)"', source).group(1))
    canonical = re.search(r'rel="canonical" href="([^"]+)"', source).group(1)
    language = re.search(r'<html lang="([^"]+)"', source).group(1)
    content = Content(source)
    services = content.services(canonical)
    preview = content.preview(canonical)
    nodes = [json.loads(m.group(1)) for m in SCHEMA.finditer(source)]
    output = []
    for node in nodes:
        if node.get("@type") == "FAQPage" or node.get("@id") == ORIGIN + "/#organization":
            continue
        node = company_references(node)
        if node.get("@type") == "OfferCatalog" and services:
            node["itemListElement"] = [
                {"@type": "Offer", "itemOffered": {**service, "provider": {"@id": ORIGIN + "/#organization"}}}
                for service in services]
        if node.get("@type") == "Article":
            node.update(headline=content.find("h1")[0].text(), description=description,
                        image=preview["url"] if preview else IMAGE)
        if node.get("@type") == "WebSite":
            node.update(name=BRAND, alternateName=["SS49", "SS49 Tech"], publisher={"@id": ORIGIN + "/#organization"})
        if node.get("@type") in ("WebPage", "AboutPage", "CollectionPage"):
            node.update(name=title, description=description, inLanguage=language,
                        isPartOf={"@id": ORIGIN + "/#website"}, about={"@id": ORIGIN + "/#organization"})
        output.append(node)
    if not any(n.get("@type") in ("WebPage", "AboutPage", "CollectionPage") for n in output):
        output.append({"@context": "https://schema.org", "@type": "WebPage",
                       "@id": canonical + "#webpage", "url": canonical, "name": title,
                       "description": description, "inLanguage": language,
                       "isPartOf": {"@id": ORIGIN + "/#website"},
                       "about": {"@id": ORIGIN + "/#organization"}})
    output.append(company())
    faq = questions(source)
    if faq:
        output.append({"@context": "https://schema.org", "@type": "FAQPage",
                       "@id": canonical + "#faq", "mainEntity": faq})
    source = SCHEMA.sub("", source)
    source = re.sub(r'  <meta (?:property="(?:og:|article:)[^"]+"|name="twitter:[^"]+")[^>]*>\n', "", source)
    article = next((n for n in output if n.get("@type") == "Article"), None)
    image = preview if article and preview else {"url": IMAGE, "width": "512", "height": "512", "alt": BRAND + " company logo"}
    image_type = "image/jpeg" if image["url"].endswith((".jpg", ".jpeg")) else "image/png"
    meta = {"og:locale": language.replace("-", "_") if "-" in language else "en_IN",
            "og:title": title, "og:description": description,
            "og:type": "article" if article else "website", "og:url": canonical,
            "og:image": image["url"], "og:image:secure_url": image["url"], "og:image:type": image_type,
            "og:image:width": image["width"], "og:image:height": image["height"],
            "og:image:alt": image["alt"], "og:site_name": LEGAL,
            "twitter:card": "summary_large_image" if article and preview else "summary",
            "twitter:title": title, "twitter:description": description,
            "twitter:image": image["url"], "twitter:image:alt": image["alt"]}
    if article:
        for key, field in [("article:published_time", "datePublished"), ("article:modified_time", "dateModified")]:
            if article.get(field):
                meta[key] = article[field]
    tags = []
    for key, value in meta.items():
        attr = "name" if key.startswith("twitter:") else "property"
        tags.append(f'  <meta {attr}="{key}" content="{html.escape(value, quote=True)}">')
    source = re.sub(r'  <link rel="preload" href="/assets/fonts/[^"]+"[^>]*>\n', "", source)
    font_preload = f'  <link rel="preload" href="{FONT}" as="font" type="font/woff2" crossorigin>'
    home_stylesheet = r'(  <link rel="stylesheet" href="assets/css/home\.css(?:\?[^"]*)?">)'
    if re.search(home_stylesheet, source):
        source = re.sub(home_stylesheet, lambda match: font_preload + "\n" + match[0], source, count=1)
    else:
        tags.insert(0, font_preload)
    source = re.sub(r'(assets/css/enterprise\.css)(?:\?[^"\s]+)?', r'\1?v=20261101-header', source)
    if canonical.removeprefix(ORIGIN) in REGIONS.values():
        source = re.sub(r'  <link rel="alternate" hreflang="[^"]+" href="[^"]+">\n', "", source)
        tags += [f'  <link rel="alternate" hreflang="{lang}" href="{ORIGIN}{path}">' for lang, path in REGIONS.items()]
    for node in output:
        serialized = json.dumps(node, ensure_ascii=True, indent=2).replace("<", "\\u003c")
        tags.append('  <script type="application/ld+json">\n' + serialized + '\n  </script>')
    source = re.sub(r"^[ \t]*\n", "", source, flags=re.M)
    return source.replace("</head>", "\n".join(tags) + "\n</head>")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    files = subprocess.check_output(["git", "ls-files", "*.html"], cwd=ROOT, text=True).splitlines()
    changed = []
    for file in files:
        path = ROOT / file
        source = path.read_text()
        updated = sync(source)
        if updated != source:
            changed.append(file)
            if not args.check:
                path.write_text(updated)
    print(f"{'Out of sync' if args.check else 'Updated'}: {len(changed)} pages")
    if args.check and changed:
        raise SystemExit("\n".join(changed))


if __name__ == "__main__":
    main()
