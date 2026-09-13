# Mateo Gray — Passport Invitation

An updated version of your HTML/CSS/JavaScript project. No npm install or framework is required.

## Open it

1. Extract this ZIP into a new folder first so you can compare it with your original.
2. Open the folder in VS Code.
3. Use the Live Server extension and open `index.html` with Live Server.
4. Alternatively run `python -m http.server 8000` in this folder and open http://localhost:8000.

Use a local server for reliable downloads; opening index.html directly with file:// may restrict canvas export in some browsers.

## What changed

- A properly proportioned chocolate passport cover, reference-style gold crest, passport symbol, and a two-beat 3D opening: first an orientation turn with subtle perspective, then the cover flips away in depth (`rotateY`) with a drop shadow before the single portrait page inside is revealed. The closed cover is a centered portrait cover. The open passport reveals one fixed portrait page: the aqua verse/compass story on top and the white SAVE THE DATE / event details panel with the portrait baby photo and immigration stamp below, with a full-width MRZ strip along the bottom.
- Royal blue, aqua, white, and gold inside pages with the supplied world map and immigration stamp.
- The inside is a single portrait page that is always visible top and bottom at once on phones and desktop — verse and story above, the details panel below with stamp and MRZ strip.
- The new boarding-pass treatment uses the requested Graduate, Stardos Stencil, Roboto Mono Bold, Roboto Slab Bold, Arial, and Courier New assignments. Graduate, Stardos Stencil, and Roboto Mono are requested from Google Fonts with system fallbacks; the earlier Courgette, Lobster, Roboto Slab, and Barlow Condensed files remain bundled locally.
- The supplied baby photo is kept in `assets/baby-photo-portrait.jpg` as the portrait crop for the right page event details panel. The earlier `assets/baby-photo.jpg` and separately supplied `mateo.jpg` are retained for comparison.
- RSVP **saves directly to your Google Form** with zero backend: the form values are posted to the form's `formResponse` endpoint inside a hidden iframe (no Apps Script, no CORS). Preview-only labels appear only when the direct-form configuration is missing.
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

**Current state: RSVP submits straight to your published Google Form — no Apps Script deployment required.** The custom form builds a hidden form and posts to `CONFIG.formResponse` (`docs.google.com/forms/.../formResponse`) inside a named iframe, carrying `fbzx`, the page state fields, and the entry IDs from `CONFIG.formEntries`. Google's form-response endpoint accepts the post from any origin and records it in the form's linked Sheet, so the boarding pass is issued as soon as the submission is delivered.

`js/config.js` already contains the verified values:

- `formResponse` — the `/formResponse` URL for the form below
- `fbzx` — the form's anti-tamper token
- `formEntries` — entry IDs mapped to `name`, `phone`, `attend`, `guests`, `companions`
- `scriptUrl` — kept empty (`''`) to enable the direct-form path; paste a deployed Apps Script `/exec` URL here only if you prefer that backend

The custom form is the only RSVP path on the page — the separate "RSVP through Google Forms" link was removed. The Google Form link is used only internally by the auto-post technique.

1. Create/open a Google Form whose questions are: Full Name, Contact Number (optional), Will you attend? (Yes / No), How many guests are coming with you?, Names of your companions (optional).
2. Open it in a browser, inspect the source, and copy the `/formResponse` URL, the `fbzx` value, and the five `entry.*` IDs from the form's fields into `js/config.js` (`formResponse`, `fbzx`, `formEntries`). The values already in the file match the live form below, verified September 13, 2026.
3. Reload the site. Submit one clearly named test RSVP and verify it appears in the form's response destination (open the form's Responses tab). Test a decline and the boarding-pass download too.
4. No other configuration is needed. Updates you make to the form (new questions, changed options) must be mirrored in `formEntries` and the option text used by the RSVP radios.

Limitations of the direct path: the browser posts into a cross-origin iframe, so the site cannot read Google's confirmation text back. `postToGoogleForm` (in `js/script.js`) therefore treats delivery of the request as success and uses the local `requestId` as the reference; a late-arriving iframe `load` or a 15-second fallback timer finalizes the pass. Google still validates `fbzx` and the entry IDs server-side, so a mistyped ID silently fails to record — always confirm a test row lands in the Sheet. The Apps Script backend in `backend/Code.gs` remains available as an option (set `scriptUrl` to a deployed `/exec` URL) if you want verifiable round-trip confirmation and a dedicated Sheet instead.

### The connected Google Form

The published Google Form (inspected September 13, 2026) is the direct save destination:

https://docs.google.com/forms/d/e/1FAIpQLScAuOmAzvQ6JNdb-mUTfGfAYw9mp9Uvv7SWZkjbxv_TO3Xx4w/viewform

`js/config.js` carries that form's `/formResponse` URL, `fbzx`, and the entry IDs from the exact questions:

- Full Name
- Contact Number (optional)
- Will you attend? (Yes / No)
- How many guests are coming with you?
- Names of your companions (optional)

If you repurpose the form, copy its new `/formResponse`, `fbzx`, and the `entry.*` values into `js/config.js`, and make sure the RSVP attendance radios and guest-count values match the form's option text (the form sends `payload.attend` and `payload.guestCount` verbatim).

`backend/Code.gs` remains available as the optional Apps Script backend (`GOOGLE_FORM_EDIT_ID` is preconfigured for that form). With `scriptUrl` empty it is not used; the direct form post is.

## Other settings

Edit `js/config.js`:

- `maps.church` and `maps.reception`: verified full https map URLs. The supplied QR crops remain visible even while these links are blank; adding a URL makes each QR clickable.
- `gate` / `seat`: boarding-pass assignments. They start at `2` / `B3` to match the supplied reference and can be edited.
- `scriptUrl`: optional deployed Apps Script web app URL. Leave empty (`''`) to use the built-in direct Google Form post.
- `formResponse` / `fbzx` / `formEntries`: the live Google Form's submit-endpoint URL, anti-tamper token, and the five field IDs. These are what make RSVP saving work without any backend.
- `formUrl`: fallback Google Form link.

The current design contains the specified September 19, 2026 event text in both HTML and config. If repurposing it for another event, update both, including cover captions, Bible verses, and page metadata.

## Hosting

Upload this folder's contents to your chosen static host, preserving relative folders and filenames. `index.html` belongs at its root. Use HTTPS. RSVP saving needs no backend for the direct-Google-Form path; the optional Apps Script deployment powers the alternative backend. No live website was deployed as part of this ZIP update.

Keep the Google Sheet private to the organizer. The optional QR codes lead only to venue maps; attendee details are not placed in URLs. The boarding pass is an invitation keepsake, not a secure event check-in credential.

## Files

- `index.html` — page content, form, and popup markup
- `css/style.css` — reference design, responsive layouts, animation
- `css/fonts.css` and `assets/fonts/` — bundled fonts and licenses plus the boarding-pass web-font mapping
- `assets/baby-photo-portrait.jpg` — portrait crop used in the right page event details panel
- `assets/boarding-background.png`, `assets/boarding-arrow.png`, `assets/boarding-barcode.png`, `assets/church-qr.png`, `assets/reception-qr.png` — supplied boarding-pass artwork used on screen and in exports
- `js/config.js` — organizer configuration
- `js/script.js` — interaction, sounds, RSVP, QR, download
- `js/vendor/qrcode.js` — qrcode-generator 1.4.4 (MIT notice retained)
- `backend/Code.gs` — Apps Script backend
- `assets/source/` — original invitation reference images, including the latest `Inside-3.jpg`, preserved

## Validation limits

The live Google Apps Script deployment and the organizer-authorized Google Form mirror cannot be verified from an unconfigured ZIP. See `VALIDATION.md` for the checks completed on the local project.
