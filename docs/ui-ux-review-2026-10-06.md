# Website UI/UX Review

Scope: all 31 public HTML routes, shared navigation and footer, homepage,
client-system discovery, screenshot galleries, and the project-enquiry flow.
This is a heuristic and browser-based review, not a user study or accessibility certification.

## Findings and Changes

| Finding | Evidence | Change |
| --- | --- | --- |
| Mobile information was too small | Homepage links measured 9.44px and 9.92px; market descriptions measured 10.72px | Increased action, description, metadata, and footer text sizes |
| Footer actions were hard to tap | 18 homepage footer links were under 24px tall | Minimum 44px touch areas, including the home/logo link |
| Mobile navigation depended entirely on JavaScript | Primary navigation was hidden with JavaScript disabled | Visible fallback navigation; hide the inoperable menu toggle |
| Short screens could lose gallery content | Gallery measured 510px tall in a 390px viewport, with no internal scrolling | Viewport-bounded, scrollable gallery; mobile controls below the image |
| Finding a project required excess scrolling | Opening portfolio panel explained status labels rather than linking to work | Direct client-system shortcuts plus region navigation that opens the target group |
| The brief was buried below the chat on phones | Mobile layout places the conversation before the form | Direct brief shortcut and a separate human-contact route near the page heading |
| Form effort was unclear | Only HTML validation distinguished required and optional fields | Visible field requirements and clearer primary/secondary review actions |
| Small-screen menus could exceed the viewport | Expanded navigation plus sticky header competes with landscape height | Viewport-bounded, scrollable mobile header |

## Verification

- Browser layout checks: 31 routes at 320, 390, 768, 1024, 1280, and 1440px.
- Targeted journeys: region links, brief shortcut, guided assistant, brief review/edit,
  keyboard menu dismissal, gallery navigation, and focus restoration.
- Additional checks: landscape menu/gallery, footer touch targets, and navigation
  without JavaScript.
- Static checks: HTML, local links, image alternatives, structured data, and scripts.
- Preserved: client identities, delivery statuses, masked screenshots, legal identity,
  contact destinations, and existing project URLs.

## Desktop Follow-Up

- Kept the full navigation visible above 1100px, including standard 1280px laptops.
- Reduced desktop header and hero height, and trimmed section gaps without reducing body text.
- Moved section headings back onto a consistent left-aligned reading path.
- Increased the content limit moderately on wide monitors while constraining long paragraphs.
- Reduced oversized proposal-panel labels and the initial assistant conversation height.
- At 1280 x 800, project-region controls moved from approximately 843px to 745px
  below the top of the viewport. The navigation is now visible without opening a menu.
- Desktop layout coverage: 1101, 1280, 1366, 1440, and 1920px.

## Remaining Validation

- Test with prospective clients to evaluate comprehension and enquiry completion.
- Review analytics after release; no conversion improvement is claimed from this audit.
- Live AI-provider availability and external booking completion are outside the local
  browser tests, which deliberately block external requests.
- A dedicated screen-reader and cross-browser accessibility review remains advisable.
