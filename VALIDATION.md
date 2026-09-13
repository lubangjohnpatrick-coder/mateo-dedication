# Validation record

Checked locally on September 13, 2026.

- `node --check js/script.js` passed; `node --check js/config.js` passed.
- `css/style.css` parses cleanly with balanced comment blocks and balanced braces.
- The passport restores the reference-led true booklet model (matching the approved v5 opening): the closed cover is a CENTERED PORTRAIT cover; opening completes a brief landscape orientation turn (`rotateZ(90deg)`, `scale(.7–.76)`, centered, no large translation) and then the cover hinges open (`rotateY(-180deg)` on the left spine) onto TWO facing portrait pages side by side.
- The two inside pages are never stacked vertically and are never hidden behind single-page pagination on phones: page 01 (verse/map/compass/dedication title) and page 02 (SAVE THE DATE / baby photo / event details / stamp / character strip) both render as a side-by-side spread. On phones each page is ≈46vw so the whole spread fits within ~92vw; it scrolls horizontally only when necessary.
- Cover content is centered (PASSPORT title, gold crest, Dedication of Mateo Gray, chip symbol, 19 SEPTEMBER 2026) with no barcode and no flip badge.
- RSVP is a SINGLE action: Confirm Attendance opens the published Google Form in a new tab (`?usp=dialog`). The custom questionnaire was removed and no code claims the page received an attendee's name or auto-created a personalized pass.
- The boarding pass is an honest, clearly-labelled PREVIEW (banner always visible; fixed `MATEO GRAY'S GUEST` passenger; `PREVIEW-` filename prefix on the export). The on-screen pass keeps the fixed 1314 × 621 landscape geometry that scales as a whole, and **Save Boarding Pass Photo** exports the same 1414 × 680 landscape PNG (2× backing resolution) with a data-URL fallback when `canvas.toBlob` is unavailable.
- Boarding-pass reference details verified: GATE 2, SEAT B3, supplied barcode crop, church/reception QR crops, Matthew 19:14 stub, gold passenger box.
- Sound default is on and begins after the first gesture (browsers block autoplay); the toggle is remembered.
- Reduced-motion and no-3D users receive the final readable open state without the animation.
- All local font, image, and QR references were checked for existing files, including the baby photo, boarding-pass background, chevron strip, barcode, and the two QR crops.
- Browser screenshot/export automation could not be run in this environment (no Playwright browser binary). Confirm the final visual in Live Server at 390×844, 599×833, and 1366×768 before publishing: closed cover centered portrait; visible landscape turn; two portrait pages side by side in the open state; no clipped/overlapping text; no console errors; exactly one RSVP path; the boarding-pass preview banner + Save Boarding Pass Photo working.