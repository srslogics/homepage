# SrS Logics Website

Static multi-page website for SrS Logics, a Nagpur-based custom software company serving businesses and institutions across India and the UAE.

## Positioning

SrS Logics designs internal business systems around real operating requirements, including:

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
- `assets/js/site-nav.js` - global navigation behavior
- `assets/images/` - brand and project media

## Technical Notes

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
