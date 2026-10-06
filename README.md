# SS49 D1T1TECH Website

Static multi-page website for SS49 D1T1TECH, a Nagpur-based custom software company serving businesses and institutions across India and the UAE.

Official company name: **SS49 D1T1TECH (OPC) PRIVATE LIMITED**. Short brand and logo: **SS49**. Formerly **SrS Logics**. Public contact email: **founder@ss49d1t1tech.in**, confirmed 7 October 2026. Canonical website URLs, social account URLs, and the assistant endpoint are unchanged; primary-domain migration is separate.

## Brand Assets

- `assets/brand/ss49-wordmark-source.png` and `ss49-avatar-source.png` are the approved, non-interlocking logo masters.
- `node scripts/build_brand_assets.cjs` exports the website artwork, favicons, and social-share image. It requires `sharp`.
- The SVG files wrap the approved raster artwork; they are not vector-traced logo masters.
- Older `s9s-logics-*.svg` files are retained for historical reference only and are not used by current pages.
- Run `node --test scripts/branding.test.mjs scripts/assistant.test.mjs` and `python3 scripts/check_site.py` before release.
- `node scripts/check_brand_browser.cjs` checks all public pages at six phone, tablet, and desktop widths, plus menus, galleries, FAQs, and the offline project brief; it requires `playwright` and Chrome. Screenshots and results go in ignored `tmp/ss49-review/`. External requests are blocked, so this does not test the deployed AI service.

## Positioning

SS49 D1T1TECH designs internal business systems around real operating requirements, including:

- Workflow and approval platforms
- Finance and operations systems
- Management dashboards and reporting
- Business data analysis systems
- Education management software
- Custom software for India and UAE clients

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

- `assets/css/enterprise.css` is the current visual system. Existing layout and behavior styles are isolated in a lower-priority `legacy` cascade layer.
- Manrope is self-hosted in `assets/fonts/` under the included SIL Open Font License; no third-party font request is needed.
- Framework-free HTML, CSS, and JavaScript
- Shared responsive design system
- Canonical URLs, Open Graph metadata, and JSON-LD structured data
- `sitemap.xml`, `robots.txt`, and machine-readable company briefs
- Private invoice pages use `noindex,nofollow`
- The assistant defaults to curated answers without an API connection. Live AI
  requires a separately hosted service with a server-only key, usage controls,
  and a configured public endpoint. The existing static hosting is unchanged.

## Public Website

https://srslogics.com/
