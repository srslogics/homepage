"""Regression tests for visible-content metadata, without network access."""
import json
import unittest

from search_content import Content
from sync_search_metadata import ORIGIN, ROOT, SCHEMA, company_references, questions, sync


class SearchMetadataTest(unittest.TestCase):
    def test_both_faq_layouts_in_document_order(self):
        source = '''<section id="frequently-asked-questions"><article class="card">
        <h3>What do you <strong>build</strong>?</h3><p>Apps &amp; platforms.</p>
        <p>Read <a href="/services/">our services</a>.</p></article></section>
        <details open><summary>Can we talk?</summary><p>Yes.<br>Contact us.</p></details>'''
        self.assertEqual(Content(source).questions(), [
            ("What do you build?", "Apps & platforms. Read our services."),
            ("Can we talk?", "Yes. Contact us.")])
        self.assertEqual(questions(source)[0]["acceptedAnswer"]["text"], "Apps & platforms. Read our services.")

    def test_excludes_non_faq_cards_empty_answers_and_selectors(self):
        source = '''<article><h3>Not an FAQ?</h3><p>Ordinary content.</p></article>
        <details><summary>Regions</summary><p>India.</p></details>
        <details><summary>Empty?</summary></details>
        <details><summary>Ready?</summary><p>Yes.</p></details>
        <details><summary>Ready?</summary><p>Yes.</p></details>'''
        self.assertEqual(Content(source).questions(), [("Ready?", "Yes.")])

    def test_service_catalog_uses_only_explicit_visible_cards(self):
        source = '''<article id="apps" data-service><h3>Apps &amp; tools</h3><p>Your <b>requirements</b>.</p></article>
        <article><h3>Something else</h3><p>Not a service.</p></article>'''
        self.assertEqual(Content(source).services(ORIGIN + "/services/")[0], {
            "@type": "Service", "@id": ORIGIN + "/services/#apps", "name": "Apps & tools",
            "description": "Your requirements.", "url": ORIGIN + "/services/#apps"})

    def test_company_references_preserve_other_entities(self):
        other = {"@type": "Organization", "name": "A client"}
        value = {"provider": {"@id": ORIGIN + "/#organization", "@type": "ProfessionalService", "name": "Stale name"}, "mentions": [other]}
        self.assertEqual(company_references(value), {"provider": {"@id": ORIGIN + "/#organization"}, "mentions": [other]})

    def test_about_connects_short_names_to_visible_company_identity(self):
        source = (ROOT / "about/index.html").read_text()
        content = Content(source)
        self.assertIn("SS49 is the short name for SS49 D1T1TECH.", content.find("main")[0].text())
        answer = dict(content.questions())["What is SS49 D1T1TECH?"]
        self.assertIn("SS49 and SS49 Tech are short names for the same company.", answer)
        visible = content.find("main")[0].text()
        self.assertIn("SS49 D1T1TECH (OPC) PRIVATE LIMITED", visible)
        self.assertIn("Nagpur", visible)
        faq = next(json.loads(m.group(1)) for m in SCHEMA.finditer(source)
                   if json.loads(m.group(1)).get("@type") == "FAQPage")
        schema_answer = next(q["acceptedAnswer"]["text"] for q in faq["mainEntity"]
                             if q["name"] == "What is SS49 D1T1TECH?")
        self.assertEqual(schema_answer, answer)

    def test_article_preview_is_opt_in_and_preserves_dates(self):
        source = (ROOT / "case-studies/knp-enterprise-finance/index.html").read_text()
        before = next(json.loads(m.group(1)) for m in SCHEMA.finditer(source) if json.loads(m.group(1)).get("@type") == "Article")
        after = next(json.loads(m.group(1)) for m in SCHEMA.finditer(sync(source)) if json.loads(m.group(1)).get("@type") == "Article")
        self.assertEqual(after["datePublished"], before["datePublished"])
        self.assertEqual(after["dateModified"], before["dateModified"])
        self.assertEqual(after["image"], ORIGIN + "/assets/images/projects-knp-dashboard.jpg")
        self.assertIsNone(Content('<img src="unrelated.png">').preview(ORIGIN))

    def test_founder_is_collapsed_accessible_and_matches_metadata(self):
        source = (ROOT / "about/index.html").read_text()
        content = Content(source)
        founders = [n for n in content.root.walk() if n.attrs.get("id") == "founder"]
        self.assertEqual(len(founders), 1)
        founder = founders[0]
        self.assertEqual(founder.tag, "details")
        self.assertNotIn("open", founder.attrs)
        self.assertNotIn("hidden", founder.attrs)
        self.assertNotIn("aria-hidden", founder.attrs)
        self.assertEqual(next(n.text() for n in founder.walk() if n.tag == "summary"),
                         "Who founded SS49 D1T1TECH?")
        nodes = [json.loads(m.group(1)) for m in SCHEMA.finditer(source)]
        person = next(n for n in nodes if n.get("@type") == "Person")
        self.assertEqual(person["@id"], ORIGIN + "/about/#founder")
        self.assertEqual(person["url"], person["@id"])
        self.assertEqual(person["description"],
                         next(n.text() for n in founder.walk() if n.tag == "p"))
        links = {n.attrs.get("href") for n in founder.walk() if n.tag == "a"}
        self.assertTrue(set(person["sameAs"]).issubset(links))
        self.assertIn("Nagpur, Maharashtra, India", founder.text())
        faq = next(n for n in nodes if n.get("@type") == "FAQPage")
        answer = next(q["acceptedAnswer"]["text"] for q in faq["mainEntity"]
                      if q["name"] == "Who founded SS49 D1T1TECH?")
        self.assertEqual(answer, dict(content.questions())["Who founded SS49 D1T1TECH?"])
        self.assertEqual(sync(source), source)

    def test_idempotence_and_redirect_preservation(self):
        for file in ("index.html", "services/index.html", "case-studies/knp-enterprise-finance/index.html"):
            with self.subTest(file=file):
                result = sync((ROOT / file).read_text())
                self.assertEqual(sync(result), result)
        redirect = '<html><head><meta http-equiv="refresh" content="0;url=/new/"></head></html>'
        self.assertEqual(sync(redirect), redirect)

    def test_support_terms_stay_consistent_in_visible_content(self):
        terms = ("Proposals can include 6 months of post-launch maintenance. "
                 "The covered services, response route, and exclusions are stated in the project agreement.")
        for file in ("index.html", "pricing/index.html", "process/index.html"):
            with self.subTest(file=file):
                content = Content((ROOT / file).read_text())
                self.assertIn(terms, content.find("main")[0].text())
                if file != "pricing/index.html":
                    self.assertTrue(any(terms in answer for _, answer in content.questions()))

    def test_buyer_guidance_and_cross_industry_positioning(self):
        home = Content((ROOT / "index.html").read_text()).find("main")[0].text()
        self.assertIn("Your project can be in a different industry", home)
        pricing = dict(Content((ROOT / "pricing/index.html").read_text()).questions())
        for question in ("What costs should we consider beyond development?",
                         "Can we begin with a smaller first release?",
                         "What should we share to get an estimate?"):
            self.assertIn(question, pricing)
            self.assertGreater(len(pricing[question]), 80)
        services = (ROOT / "services/index.html").read_text()
        process = (ROOT / "process/index.html").read_text()
        self.assertIn('id="custom-or-ready-made"', services)
        self.assertIn('id="project-brief"', process)
        self.assertIn('../services/#custom-or-ready-made', process)

    def test_editorial_article_has_visible_author_and_project_evidence(self):
        source = (ROOT / "insights/the-invisible-engine/index.html").read_text()
        self.assertIn('../../about/#founder', source)
        self.assertNotIn("20%", source)
        self.assertNotIn("80%", source)
        self.assertIn('../../case-studies/lakshya-education-operations/', source)
        self.assertIn("KNP Signature", source)
        article = next(json.loads(m.group(1)) for m in SCHEMA.finditer(source)
                       if json.loads(m.group(1)).get("@type") == "Article")
        self.assertIn('datetime="' + article["dateModified"] + '"', source)


if __name__ == "__main__":
    unittest.main()
