# Mateo Gray — Passport Invitation

An updated version of your HTML/CSS/JavaScript project. No npm install or framework is required.

## Open it

1. Extract this ZIP into a new folder first so you can compare it with your original.
2. Open the folder in VS Code.
3. Use the Live Server extension and open `index.html` with Live Server.
4. Alternatively run `python -m http.server 8000` in this folder and open http://localhost:8000.

Use a local server for reliable downloads; opening index.html directly with file:// may restrict canvas export in some browsers.

## What changed

- A properly proportioned chocolate passport cover, reference-style gold crest, passport symbol, barcode, and left-spine 3D opening. The closed cover remains landscape like the supplied Front reference, completes a visible orientation turn before opening, and then reveals one fixed portrait inside page like the supplied Inside(3) reference: story/map panel above, SAVE THE DATE divider, event details with the upright baby photo, stamp, and passport character strip below.
- Royal blue, aqua, white, and gold inside pages with the supplied world map and immigration stamp.
- The inside follows the latest vertical passport sample as one fixed portrait page: verse/map story panel above, SAVE THE DATE band, event details, and MRZ strip below. It remains readable on phones and desktop.
- The new boarding-pass treatment uses the requested Graduate, Stardos Stencil, Roboto Mono Bold, Roboto Slab Bold, Arial, and Courier New assignments. Graduate, Stardos Stencil, and Roboto Mono are requested from Google Fonts with system fallbacks; the earlier Courgette, Lobster, Roboto Slab, and Barlow Condensed files remain bundled locally.
- The supplied baby photo is kept in `assets/baby-photo-portrait.jpg` as a direct portrait crop from the latest vertical reference. The earlier `assets/baby-photo.jpg` and separately supplied `mateo.jpg` are retained for comparison.
- Preview-only labels until an RSVP backend is connected, plus a working link to your original Google Form.
- Personalized boarding pass popup, guest count including the respondent, a reference number, View My Boarding Pass button, and a visible **Save Boarding Pass Photo** action. The on-screen pass uses one fixed 1314 × 621 landscape reference canvas; desktop and phones uniformly scale or horizontally scroll that same geometry instead of reflowing it. The export is always the same 1414 × 680 landscape PNG (2× backing resolution), with the aqua map panel, vertical barcode, QR pair, Matthew 19:14 stub, and gold GATE 2 / SEAT B3 card from the supplied reference.
- Wrapped long names and venue details in the downloadable pass.
- The supplied boarding-pass background, chevron strip, barcode crop, and church/reception QR crops are used in the popup and PNG export. The QR crops remain visible as provided; adding verified map URLs in `js/config.js` makes them clickable without replacing the supplied artwork.
- A baby-themed lullaby soundscape with soft music-box tones, paper-turn sounds, passport-like orientation whoosh, and dedication stamp sound. Sound defaults to on and starts on the first tap, because browsers block audio before user interaction; the remembered toggle can still mute it.
- Keyboard operation, focus management, modal background isolation, reduced-motion behavior, mobile input sizing, and pending/error feedback.
- Backend validation, a dedicated RSVP sheet, formula-safe text, locking, and request identifiers to make retries idempotent.

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

## Connect real RSVP saving

**Current state: the custom form is ready for real saving after the one-time Apps Script deployment.** The static GitHub site cannot securely submit to and verify a Google Form by itself. The custom form sends JSON to the Apps Script `/exec` endpoint; the script writes the RSVP to the dedicated Sheet and mirrors it into the supplied Google Form using the prefilled form ID. The boarding pass appears only after the endpoint returns a verified success response.

The Google Form link remains available as a fallback.

1. Create/open the Google Sheet you will use for the organizer's guest list.
2. Open **Extensions → Apps Script**.
3. Paste `backend/Code.gs`, save, and deploy a new **Web app**.
4. Set **Execute as: Me** and **Who has access: Anyone**. Google will request the organizer's authorization.
5. Copy the deployment URL ending in `/exec`.
6. Open `js/config.js` and paste it into `scriptUrl`.
7. Reload the site. The custom form now requires a successful server response before issuing a confirmed pass.
8. Submit one clearly named test RSVP. Verify it in both the **Dedication RSVPs** sheet and the linked Google Form response destination, then remove the test row as appropriate. Test a decline too.

If the account does not permit an anonymous web app, or the browser cannot read the Apps Script response, keep the Google Form link available and resolve deployment permissions before inviting guests. Do not replace the fetch with `no-cors`; it would prevent the site from verifying whether saving succeeded.

The Sheet is the authoritative record. The same request ID is retained when retrying an unchanged failed/uncertain submission within the open page, so a retry returns the original ticket instead of writing another row. Reloading the page starts a new session. This is not a guest identity or one-RSVP-per-person system.

### Google Form mirror

The custom questions match the published Google Form, inspected on September 13, 2026:
https://docs.google.com/forms/d/e/1FAIpQLScAuOmAzvQ6JNdb-mUTfGfAYw9mp9Uvv7SWZkjbxv_TO3Xx4w/viewform

`backend/Code.gs` already contains that form ID in `GOOGLE_FORM_EDIT_ID`. During the first Apps Script deployment, Google asks the organizer to authorize Forms access. The backend then creates a real Form response with the exact question titles and choices:

- Full Name
- Contact Number (optional)
- Will you attend?
- How many guests are coming with you?
- Names of your companions (optional)

The form requires a guest-count choice even for a decline. The backend sends **Just me** for that required choice while preserving **Sorry, cannot attend** for attendance, and records 0 attendees in the dedicated Sheet. If mirroring fails, the Sheet row remains valid and is marked **Needs organizer review** rather than being submitted a second time.

## Other settings

Edit `js/config.js`:

- `maps.church` and `maps.reception`: verified full https map URLs. The supplied QR crops remain visible even while these links are blank; adding a URL makes each QR clickable.
- `gate` / `seat`: boarding-pass assignments. They start at `2` / `B3` to match the supplied reference and can be edited.
- `scriptUrl`: deployed Apps Script web app URL.
- `formUrl`: fallback Google Form link.

The current design contains the specified September 19, 2026 event text in both HTML and config. If repurposing it for another event, update both, including cover captions, Bible verses, and page metadata.

## Hosting

Upload this folder's contents to your chosen static host, preserving relative folders and filenames. `index.html` belongs at its root. Use HTTPS. Apps Script remains the separate RSVP backend. No live website was deployed as part of this ZIP update.

Keep the Google Sheet private to the organizer. The optional QR codes lead only to venue maps; attendee details are not placed in URLs. The boarding pass is an invitation keepsake, not a secure event check-in credential.

## Files

- `index.html` — page content, form, and popup markup
- `css/style.css` — reference design, responsive layouts, animation
- `css/fonts.css` and `assets/fonts/` — bundled fonts and licenses plus the boarding-pass web-font mapping
- `assets/baby-photo-portrait.jpg` — direct portrait crop used in the vertical invitation details panel
- `assets/boarding-background.png`, `assets/boarding-arrow.png`, `assets/boarding-barcode.png`, `assets/church-qr.png`, `assets/reception-qr.png` — supplied boarding-pass artwork used on screen and in exports
- `js/config.js` — organizer configuration
- `js/script.js` — interaction, sounds, RSVP, QR, download
- `js/vendor/qrcode.js` — qrcode-generator 1.4.4 (MIT notice retained)
- `backend/Code.gs` — Apps Script backend
- `assets/source/` — original invitation reference images, including the latest `Inside-3.jpg`, preserved

## Validation limits

The live Google Apps Script deployment and the organizer-authorized Google Form mirror cannot be verified from an unconfigured ZIP. See `VALIDATION.md` for the checks completed on the local project.
