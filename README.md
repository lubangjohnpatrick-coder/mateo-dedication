# Mateo Gray — Passport Invitation

An updated version of your HTML/CSS/JavaScript project. No npm install or framework is required.

## Open it

1. Extract this ZIP into a new folder first so you can compare it with your original.
2. Open the folder in VS Code.
3. Use the Live Server extension and open `index.html` with Live Server.
4. Alternatively run `python -m http.server 8000` in this folder and open http://localhost:8000.

Use a local server for reliable downloads; opening index.html directly with file:// may restrict canvas export in some browsers.

## What changed

- A properly proportioned chocolate passport cover (centered portrait like the approved v5 opening), gold crest, passport symbol, and left-spine 3D opening. The closed cover completes a brief landscape orientation turn (`rotateZ(90deg)`, centered) before the hinge opens onto TWO facing portrait pages (story page 01 + event-details page 02) side by side — never stacked vertically.
- Royal blue, aqua, white, and gold inside pages with the supplied world map and immigration stamp.
- The inside is a two-page spread: page 01 carries the verse/map story panel with the compass and dedication title; page 02 carries the SAVE THE DATE band, the upright baby photo, event details, stamp, and character strip. Both pages stay side by side on every screen, sized so the whole spread fits within ~92vw on phones.
- The new boarding-pass treatment uses the requested Graduate, Stardos Stencil, Roboto Mono Bold, Roboto Slab Bold, Arial, and Courier New assignments. Graduate, Stardos Stencil, and Roboto Mono are requested from Google Fonts with system fallbacks; the earlier Courgette, Lobster, Roboto Slab, and Barlow Condensed files remain bundled locally.
- The supplied baby photo is kept in `assets/baby-photo-portrait.jpg` as a direct portrait crop from the latest vertical reference. The earlier `assets/baby-photo.jpg` and separately supplied `mateo.jpg` are retained for comparison.
- RSVP is ONE action only: the Confirm Attendance button opens the published Google Form in a new tab. There is no custom questionnaire on the page, and the site never claims it received an attendee's name — static hosting cannot read the submitted response.
- A clearly-labelled boarding pass PREVIEW (banner always visible) with a Preview Boarding Pass button and the visible **Save Boarding Pass Photo** action. The on-screen pass keeps the fixed 1314 × 621 landscape reference canvas that scales as a whole on phones and desktop; it does not reflow into the overlapping portrait layout. The export is always the same 1414 × 680 landscape PNG (2× backing resolution), with the aqua map panel, vertical barcode, QR pair, Matthew 19:14 stub, and gold GATE 2 / SEAT B3 card from the supplied reference.
- Wrapped long names and venue details in the downloadable pass.
- The supplied boarding-pass background, chevron strip, barcode crop, and church/reception QR crops are used in the popup and PNG export. The QR crops remain visible as provided; adding verified map URLs in `js/config.js` makes them clickable without replacing the supplied artwork.
- A baby-themed lullaby soundscape with soft music-box tones, paper-turn sounds, passport-like orientation whoosh, and dedication stamp sound. Sound defaults to on and starts on the first tap, because browsers block audio before user interaction; the remembered toggle can still mute it.
- Keyboard operation, focus management, modal background isolation, reduced-motion behavior, mobile input sizing, and pending/error feedback.
- The optional Apps Script backend (`backend/Code.gs`) remains available for organizers who prefer server-verified submissions; the hosted site itself uses a single Google Form link.

The supplied `compass.png` has a checkerboard baked into its pixels. The website uses the clean vector `assets/compass.svg` instead. Your original PNG is retained. The supplied `passport logo.png` is used as provided; some gold speckling remains in that asset.

## Your font mapping

| Element | Font |
|---|---|
| PASSPORT | Times New Roman Regular |
| Dedication of Mateo Gray (cover) | Courgette Regular |
| REPUBLIKA NG PILIPINAS | Lettering embedded in your crest image; intended match Arial Bold |
| Barcode numbers | Arial Regular |
| Mateo Gray’s (inside) | Lobster Regular |
| DEDICATION | Georgia Bold |
| Verse and 1 Samuel 1:27–28 | Roboto Slab Bold |
| SAVE THE DATE | Arial Black with letter spacing |
| NAME / DATE / TIME / VENUE | Arial Narrow Bold |
| Name, date, time, venue values | Barlow Condensed Bold |
| IMMIGRATION / OFFICE | Lettering embedded in your supplied stamp; intended match Arial Regular |
| Passport character strip | Courier New Bold |
| BOARDING PASS | Graduate Regular with letter spacing |
| GATE 2 | Stardos Stencil Bold (web alternative to Stencil Bold) |
| SEAT B3 | Courier New Regular |
| DEDICATION DAY OF / DESTINATION / DATE / TIME | Roboto Mono Bold |
| Boarding-pass name, destination, date, time | Roboto Mono Bold |
| Bible verse and Matthew 19:14 on the pass | Roboto Slab Bold |
| PASSENGER | Arial Bold |
| Passenger name | Roboto Mono Bold |
| CHURCH / RECEPTION / SCAN US FOR MAP | Roboto Mono Bold |

Times New Roman, Georgia, Arial, Arial Narrow, Arial Black, Stencil, and Courier New are system font requests. The boarding-pass Graduate, Stardos Stencil, and Roboto Mono families are loaded through the Google Fonts stylesheet in `css/fonts.css` and fall back to close local families when offline. The four earlier display fonts are bundled with their licenses.

## RSVP

**One action only.** The Confirm Attendance button opens your published Google Form in a new tab:

https://docs.google.com/forms/d/e/1FAIpQLScAuOmAzvQ6JNdb-mUTfGfAYw9mp9Uvv7SWZkjbxv_TO3Xx4w/viewform?usp=dialog

There is no duplicate questionnaire on the page.

Why it works this way: static hosting (GitHub Pages) cannot read a Google Form's submitted response. So the site (a) never claims it received an attendee's name, and (b) never pretends it auto-created a personalized pass. The boarding pass on the page is an honest, clearly-labelled PREVIEW with a fixed passenger line (the filename prefix is also `PREVIEW-`).

`js/config.js` settings:

- `formUrl` — the Google Form link opened by the RSVP button (already set to `?usp=dialog`).
- `formResponse` / `fbzx` / `formEntries` — legacy submit-endpoint details kept for reference; the optional Apps Script backend in `backend/Code.gs` uses the same form. Not read while `scriptUrl` is empty.
- `scriptUrl` — optional deployed Apps Script `/exec` URL if you ever prefer a server-verified round-trip path instead of the link-out flow.

To track attendance, check the form's Responses tab after guests confirm through the linked form. If you repurpose the form, point `formUrl` at the new one; nothing else in the site needs to change.

## Other settings

Edit `js/config.js`:

- `maps.church` and `maps.reception`: verified full https map URLs. The supplied QR crops remain visible even while these links are blank; adding a URL makes each QR clickable.
- `gate` / `seat`: boarding-pass assignments. They start at `2` / `B3` to match the supplied reference and can be edited.
- `scriptUrl`: optional deployed Apps Script web app URL. Leave empty (`''`); the site links guests to the Google Form instead.
- `formResponse` / `fbzx` / `formEntries`: legacy submit details for the optional Apps Script backend; not used by the link-out RSVP.
- `formUrl`: the Google Form link opened by Confirm Attendance (new tab).

The current design contains the specified September 19, 2026 event text in both HTML and config. If repurposing it for another event, update both, including cover captions, Bible verses, and page metadata.

## Hosting

Upload this folder's contents to your chosen static host, preserving relative folders and filenames. `index.html` belongs at its root. Use HTTPS. RSVP needs no backend at all — guests confirm through the linked Google Form; the optional Apps Script deployment in `backend/Code.gs` is only for organizers who want a server-side round trip. No live website was deployed as part of this ZIP update.

Keep the Google Sheet private to the organizer. The optional QR codes lead only to venue maps; attendee details are not placed in URLs. The boarding pass is an invitation keepsake, not a secure event check-in credential.

## Files

- `index.html` — page content, two-page spread markup, RSVP link button, and boarding-pass popup
- `css/style.css` — reference design, booklet opening animation, responsive layouts
- `css/fonts.css` and `assets/fonts/` — bundled fonts and licenses plus the boarding-pass web-font mapping
- `assets/baby-photo-portrait.jpg` — portrait baby photo used in the event-details panel (page 02)
- `assets/boarding-background.png`, `assets/boarding-arrow.png`, `assets/boarding-barcode.png`, `assets/church-qr.png`, `assets/reception-qr.png` — supplied boarding-pass artwork used on screen and in exports
- `js/config.js` — organizer configuration (RSVP form link, venue maps, gate/seat)
- `js/script.js` — interaction, sounds, RSVP link, boarding-pass preview + photo save
- `js/vendor/qrcode.js` — qrcode-generator 1.4.4 (MIT notice retained)
- `backend/Code.gs` — Apps Script backend
- `assets/source/` — original invitation reference images, including the latest `Inside-3.jpg`, preserved

## Validation limits

The live Google Apps Script deployment and the organizer-authorized Google Form cannot be verified from an unconfigured ZIP. See `VALIDATION.md` for the checks completed on the local project.
