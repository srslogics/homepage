# Search And Answer Visibility

## Scope And Findings

This is an on-site SEO, AEO, and GEO improvement pass, not a promise of ranking,
indexing, featured snippets, AI citations, or a perfect score. GEO here means
generative engine optimization. The established enterprise design is preserved.

The audit found FAQ structured data that no longer matched visible answers,
missing share metadata on five pages, incomplete reciprocal regional alternates,
inconsistent company entities, and service language narrower than the company's
actual positioning. Existing canonical URLs, self-hosted fonts, image dimensions,
mobile layout, and privacy-reviewed screenshots were retained.

## Changes

- One consistent Organization entity across all 30 non-redirect pages. Use the
  confirmed legal name, contact details, Nagpur base, and Instagram identity;
  no invented address, foreign office, certification, rating, or staff count.
- Unique page titles and descriptions feed matching social metadata. WebPage
  metadata connects each page to the same website and organization.
- The homepage WebSite name is the public brand, with SS49 as the short alias.
- Existing FAQ metadata is replaced with text derived from visible questions
  and answers. Pages without visible FAQs no longer carry hidden FAQ claims.
  This is semantic consistency, not a claim of Google FAQ rich-result eligibility.
- UK, US, UAE, and international overview pages carry the same reciprocal
  regional alternate links, including the international overview as x-default.
- Homepage and services answers link to actual project evidence, pricing,
  process, and remote delivery guidance. The scope is cross-industry custom
  applications, connected systems, and digital products, not just ERP/reporting.
- Machine-readable briefs use the same positioning and include Lakshya's case
  study. These files are supplementary: Google explicitly says llms.txt does
  not improve its search visibility. They are not a replacement for HTML content.
- `scripts/sync_search_metadata.py` keeps generated metadata aligned with page
  content. `--check` is read-only. `scripts/check_search.py` checks unique titles,
  canonical URLs, visible FAQ parity, identity, regional links, sitemap coverage,
  and first-party sources. Run these after content edits.

## Account And Hosting Work Still Required

Verification for this pass: all 38 existing automated tests passed; the new search
audit passed for 30 indexable pages; HTML/link/gallery checks passed for 31 pages
and 879 local links/assets. Browser checks passed across 186 page/viewport
combinations with no failures, plus menus, galleries, FAQs, and the offline brief.
The homepage and sitemap currently respond with HTTP 200, while the old domain
still fails TLS in this environment. A fresh assistant health check timed out;
the earlier new-origin check returned 403. No live AI conversation was exercised.
These edits are local until pushed and deployed; account-level work is not done.

1. Resolve and recheck the sitemap processing error in Search Console. A successful
   fetch and well-formed XML do not establish successful sitemap ingestion.
2. Verify old-domain HTTPS and path-preserving permanent redirects, then complete
   Google's Change of Address workflow. See the domain migration checklist.
3. In Search Console, confirm inclusion in Search generative AI features where
   that setting is available. Check indexing of important service/project pages.
4. Verify Bing Webmaster Tools, submit the same sitemap, and use its search and
   AI Performance reporting where available. Do not invent verification tokens.
5. Update the real Google Business Profile, Bing Places, and company social
   profiles to the same name, website, and contact details. Request honest reviews
   from actual clients; do not fabricate reviews or open foreign-office listings.
6. Update the assistant's hosted allowed-origin configuration. This remains an
   external setting, not something an `.env.example` edit applies to production.
7. Check field Core Web Vitals in Search Console when sufficient traffic exists.
   Responsive browser tests are not a performance score or real-user measurement.

## Content And Measurement

Expand case studies only using approved first-hand evidence: the client's initial
workflow, implemented scope, deployment status, anonymized screens, and outcomes
the client can substantiate. Do not invent savings or claim contracted work is live.
No bulk city/industry landing pages or pages made solely to manipulate AI answers.

Record a baseline after deployment, then compare monthly: indexed pages, search
impressions/clicks, branded and service queries, qualified enquiries, and available
AI citation/referral reports. Do not treat self-testing a prompt as a ranking metric.
Keep sitemap modification dates tied to actual changes, not every rebuild.

## Primary References

- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
- https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c
