# SS49 D1T1TECH Website

Static multi-page website for SS49 D1T1TECH, a Nagpur-based custom software company offering remote delivery across India, the UAE, the UK, and the USA.

Official company name: **SS49 D1T1TECH (OPC) PRIVATE LIMITED**. Short brand and logo: **SS49**. Primary website: **https://ss49d1t1tech.in/**. Public contact email: **founder@ss49d1t1tech.in**. Domain migration approved 7 October 2026; see `docs/domain-migration-2026-10-07.md` for hosting and Search Console steps still required after deployment.

## Brand Assets

- `assets/brand/ss49-wordmark-source.png` and `ss49-avatar-source.png` are the approved, non-interlocking logo masters.
- `node scripts/build_brand_assets.cjs` exports the website artwork, favicons, and social-share image. It requires `sharp`.
- The SVG files wrap the approved raster artwork; they are not vector-traced logo masters.
- Superseded logo artwork is removed from the published tree; originals remain recoverable in Git history. Existing raster compatibility paths contain the approved SS49 logo.
- Run `node --test scripts/branding.test.mjs scripts/assistant.test.mjs` and `python3 scripts/check_site.py` before release.
- `node scripts/check_brand_browser.cjs` checks all public pages at six phone, tablet, and desktop widths, plus menus, galleries, FAQs, and the offline project brief; it requires `playwright` and Chrome. Screenshots and results go in ignored `tmp/ss49-review/`. External requests are blocked, so this does not test the deployed AI service.

## Screenshot Privacy

Review client screenshots before adding them to the public website. Remove browser tabs, internal addresses, staff identities, account access details, and screenshot overlays. Redactions must be opaque pixels baked into the exported image, not CSS masks or reversible layers. Strip embedded metadata and keep original screenshots outside the published tree.

The nine OctoMinds images use permanent redactions and cropped browser chrome. `node scripts/redact_octominds_images.cjs /path/to/originals` rebuilds them locally with `sharp`, verifies every masked pixel and metadata removal, and preserves the source originals. Inspect every exported image before manually updating `scripts/fixtures/octominds-public-images.json`; `python3 scripts/check_site.py` rejects altered reviewed files or extra OctoMinds images. Never update hashes automatically to bypass a failed privacy check.

## Positioning

SS49 D1T1TECH builds software across industries around each client's users and requirements:

- Custom applications and digital products
- Business systems and workflow automation
- Integrations and data systems
- Client, staff, and partner platforms

## Structure

- `index.html` - primary company page
- `services/` - service capabilities
- `projects/` - active and deployed engagements
- `case-studies/` - selected client delivery stories
- `education-management-software-nagpur/` - institutional software
- `uae/` and Dubai pages - UAE market entry points
- `pricing/` and `process/` - commercial and delivery structure
- `about/`, `insights/`, and `careers/` - company information
- `assistant/` - public project guide, optional AI conversation, and local brief builder
- `server/` - separate optional AI service; see `server/README.md` before enabling
- `assets/css/` - shared design system
- `assets/js/site-nav-client-systems.js` - global navigation behavior
- `assets/images/` - brand and project media

## Technical Notes

- After changing page copy, run `python3 scripts/sync_search_metadata.py` and
  `python3 scripts/check_search.py`. FAQ answers, marked service cards, and article
  headlines are derived from the visible HTML. Keep `data-service` on service
  cards and use `data-search-image` only for a privacy-reviewed article image.
- `python3 scripts/test_search_metadata.py` covers content extraction and
  repeatable metadata generation. `.github/workflows/site-quality.yml` runs the
  static and regression checks on pushes and pull requests; it does not deploy.
- Search and AI visibility work, checks, and outstanding account-level steps are
  documented in `docs/search-quality-2026-10-13.md`. No ranking is guaranteed.

- `assets/css/enterprise.css` is the current visual system. Existing layout and behavior styles are isolated in a lower-priority `legacy` cascade layer.
- After editing `tokens.css`, `main.css`, or `enterprise.css`, run
  `python3 scripts/build_home_css.py`. The committed `home.css` bundle preserves
  cascade order and relative asset paths, avoiding a chained CSS import on the
  homepage. `python3 scripts/test_home_performance.py` checks bundle freshness
  and homepage loading regressions in CI.
- Manrope is self-hosted as a preloaded WOFF2 in `assets/fonts/` under the included
  SIL Open Font License. `python3 scripts/build_web_font.py` rebuilds it from the
  retained TTF using `fonttools[woff]`, preserving characters and variable weights.
  `font-display: optional` prevents a late font swap: a slow first visit may use
  the fallback font for that navigation rather than shifting already visible text.
- Homepage ads are intentionally disabled. First-screen text has no entrance
  animation, and below-hero screenshots reserve their dimensions and load lazily.
  Retest mobile and desktop PageSpeed after deployment; static checks cannot
  establish a Lighthouse score or identify every real-world layout shift.
- Framework-free HTML, CSS, and JavaScript
- Shared responsive design system
- Canonical URLs, Open Graph metadata, and JSON-LD structured data
- `sitemap.xml`, `robots.txt`, and machine-readable company briefs
- Private invoice pages use `noindex,nofollow`
- The project planner starts with curated answers and a local brief builder. Visitors
  choose the optional AI button before a connection is attempted. Live AI
  requires a separately hosted service with a server-only key, usage controls,
  and a configured public endpoint. The existing static hosting is unchanged.

## Public Website

https://ss49d1t1tech.in/
