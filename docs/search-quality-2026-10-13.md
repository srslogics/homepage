# Search quality review: 13 October 2026

## Scope and release state

SEO, answer clarity, and generative-search readiness for SS49 D1T1TECH.
Prepared and tested locally in the publishing checkout. This pass does not
publish the changes, submit URLs, or change any search-console account settings.

The primary name remains SS49 D1T1TECH and the legal name remains
SS49 D1T1TECH (OPC) PRIVATE LIMITED. The existing SS49 Tech alias stays in
identity metadata and supplementary briefs, not as a hidden keyword block.
The approved visible former-brand explanation on Home and About is retained.

## Improvements

- Replaced the outdated, dashboard-heavy service catalog with the capabilities
  already displayed on Home and Services. Eight entries are generated directly
  from the visible cards, with links to actual page sections.
- Updated the Services description and two visible answers to reflect work
  across applications, digital products, business systems, integrations, and
  user platforms rather than only internal software.
- Company identity links now point to the company's LinkedIn and Instagram.
  Founder profiles remain on the founder entity, rather than defining the company.
  Removed a conflicting nested company definition on the education service page.
- Both FAQ layouts now generate matching metadata: 49 visible answers across
  13 pages. Ordinary disclosure widgets and unrelated cards are excluded.
  This is content consistency work, not a promise of Google FAQ rich results.
- Five article records now use their visible headlines and current descriptions.
  Three case studies use their existing public screenshots as article/share
  images; the homepage and other pages retain the company-logo preview.
  No screenshots were altered, and the image-free Lakshya case study is preserved.
- Historical article publication/update dates are preserved. Sitemap modification
  dates were updated only on 18 pages with identity, content, or structured-data
  changes; font-only changes do not refresh the other entries.
- Qualified maintenance and timeline wording in the supplementary briefs to match
  the public proposal language. Contracted 8L Marketing work is still distinguished
  from deployed case studies. Company profiles and source links are included.
- Converted the existing Manrope variable font from 164,700 to 53,892 bytes:
  a 67.3% smaller font file. Characters, glyph order, and variable axes are retained.
  All indexable pages preload the WOFF2 with the correct cross-origin mode.
- Added source-parity, crawl-path, and font checks plus a read-only GitHub Actions
  workflow to catch regressions. GitHub execution awaits a push.

## Verification

- 30 indexable pages: unique titles and descriptions, correct canonical URLs,
  one main heading, consistent company identity, visible service/FAQ/article
  parity, regional alternates, and complete sitemap coverage.
- All 30 pages are reachable from the homepage through static HTML links.
- 31 HTML pages including the legacy education redirect: 925 local links/assets,
  valid HTML structure and JSON-LD syntax, image alternatives, JavaScript syntax,
  gallery integrity, and unchanged privacy-reviewed Lakshya image hashes.
- Six Python metadata regression tests and 41 Node branding/assistant tests pass.
- Chrome: 186 page/viewport combinations at 320, 390, 768, 1024, 1280, and
  1440 pixels, with zero failures. Menus, galleries, FAQ toggles, forms, touch
  targets, landscape behavior, and navigation without JavaScript also pass.
- Chrome confirms Manrope loads from WOFF2 without downloading the old TTF.
  Homepage screenshots were visually checked at mobile and desktop sizes.
- Public checks before deployment: home, robots.txt, and sitemap.xml return 200;
  robots.txt is plain text and sitemap.xml is XML containing 30 unique URLs.
  HTTPS www redirects with 301 to the HTTPS apex domain. No noindex HTTP header
  was found on the homepage.

These are source, browser, and endpoint checks, not a new Lighthouse score or
a measurement of real-user Core Web Vitals. External browser requests are blocked
during local tests, so the deployed assistant API and AdSense are not covered.
Search Console processing and AI citations have not been independently verified.

## Release and measurement checklist

1. Push and deploy the tested changes, including the WOFF2 file. Check the new font
   returns 200 with a font MIME type and that new metadata appears in live HTML.
2. Keep the existing successful sitemap submission. Inspect the homepage,
   Services, About, and representative case studies in Google Search Console;
   request reindexing for updated pages rather than for robots.txt or sitemap.xml.
3. Verify the domain and submit the same sitemap in Bing Webmaster Tools if this
   is not already done. Account actions require owner access.
4. Keep the Google Business Profile, LinkedIn, and Instagram names, website URL,
   contact details, and company descriptions consistent with the website.
5. Review branded queries such as SS49 D1T1TECH and SS49 Tech separately from
   service queries. Track impressions, clicks, enquiries, and actual AI citations
   over time rather than assuming schema or brief files produce rankings.
6. Complete old-domain, path-preserving redirects once access to srslogics.com is
   recovered. The new site's code cannot replace control of the old domain.
7. Add future case-study outcomes only with client approval and documented
   measurements. Do not invent reviews, locations, delivery results, or credentials.

## Maintenance

Run after editing visible content:

```sh
python3 scripts/sync_search_metadata.py
python3 scripts/test_search_metadata.py
python3 scripts/sync_search_metadata.py --check
python3 scripts/check_search.py
python3 scripts/check_site.py
node --test scripts/branding.test.mjs scripts/assistant.test.mjs
```

Browser testing additionally requires Playwright and Chrome:

```sh
node scripts/check_brand_browser.cjs
```

Do not auto-refresh publication or sitemap dates on every build. Review substantive
changes and update dates truthfully. The sync script intentionally does not invent
dates, reviews, commercial claims, or landing pages.

## Search-engine guidance

Google states that its AI features use the same foundations as Search: crawlable,
indexable pages, useful textual content, internal links, and structured data that
matches the page. There is no special AI schema or required AI text file, and
meeting the requirements does not guarantee indexing or inclusion. Supplementary
llms files here are summaries, not a Google ranking mechanism.

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
