# Primary Domain Migration

Approved 7 October 2026: SS49 D1T1TECH (OPC) PRIVATE LIMITED uses
https://ss49d1t1tech.in/ as its primary website and founder@ss49d1t1tech.in for
public contact, including career enquiries. This file records pending operational
steps; it is not a claim that deployment, redirects, or indexing have completed.

## Repository Changes

- Public canonical URLs, Open Graph URLs, hreflang, structured data, sitemap,
  robots discovery, and assistant sources use the new domain.
- Former-name copy and structured-data aliases are removed. Company Instagram
  references use the owner-confirmed https://www.instagram.com/ss49tech/ profile.
- The Utsav testimonial is a labeled, verbatim excerpt. The complete original
  quotations remain in the test fixture and Git history, not rewritten as new-brand
  endorsements. All clients, case studies, and project statuses are retained.
- The share artwork uses the new domain. Superseded SVG logo files are removed;
  historical raster URLs remain compatibility aliases containing current artwork.
- Private bills, proposals, backups, and Git history are unchanged. Screenshots of
  client applications are unchanged, including their privacy-reviewed masking.

## Hosting Actions Still Required

Local verification: 38 automated tests passed; all 31 public pages passed link,
HTML, and structured-data checks. Browser verification covered 186 page/viewport
combinations (320, 390, 768, 1024, 1280, and 1440 pixels) with no failures, plus
navigation, galleries, touch targets, and the offline assistant. This does not
verify live deployment, external redirects, or a paid AI provider conversation.

1. Deploy the approved website changes and redeploy the assistant service's
   updated knowledge. No repository push or hosting change is implied here.
2. In the existing assistant service's environment, set:
   `ASSISTANT_ALLOWED_ORIGINS=https://ss49d1t1tech.in,https://www.ss49d1t1tech.in`.
   A read-only health request using the new origin returned 403 during this work.
   Verify GET and OPTIONS return the matching Access-Control-Allow-Origin header
   after redeployment. Test a consented conversation separately.
3. Restore valid HTTPS for `srslogics.com` and `www.srslogics.com`; the old domain
   currently fails TLS checks from this environment. Configure host-specific
   permanent HTTP 301/308 redirects to `https://ss49d1t1tech.in`, preserving the
   path and query string. The new domain must not redirect back or to itself.
   This needs access to the old domain's hosting/edge configuration. Do not add
   an unconditional wildcard redirect to the shared static site: it could affect
   the new domain too. Client-side JavaScript is not a substitute for this step.
4. Verify the new non-www domain returns 200 for the homepage and representative
   project, regional, and contact pages; check asset responses and old-to-new
   redirects without loops. Keep old redirects for at least one year.
5. Ensure private folders and internal server/test/docs files are excluded by the
   production publish process; this migration does not change the hosting setup.

## Search And External Profiles

After deployment and working redirects, verify ownership of both properties in
Google Search Console. Submit the new sitemap and use Change of Address for the
old property, including relevant verified www/non-www variants. Request indexing
of the new homepage and key pages. Do not block crawling of the old URLs or use
bulk removals as a replacement for redirects.

Update the Google Business Profile, social account names/URLs, directory listings,
email signatures, and outgoing documents through their respective accounts.
Third-party mentions and cached results are outside this repository's control;
removal of every historical mention cannot be guaranteed.

References:
- https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
- https://support.google.com/webmasters/answer/9370220
- https://render.com/docs/custom-domains
- https://render.com/docs/redirects-rewrites
