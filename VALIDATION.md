# Validation record

Checked locally on September 13, 2026.

- `node --check js/script.js` passed.
- `backend/Code.gs` parses as JavaScript and the existing mocked Apps Script checks passed for valid RSVP saving, same-request retry deduplication, decline attendee count, invalid guest-count rejection, blank-name rejection, and formula-safe text handling.
- The custom RSVP fields match the published Google Form: Full Name, optional Contact Number, the two attendance choices, guest count from Just me through 11 or more, and optional companion names.
- The Apps Script backend is prefilled with the supplied Google Form ID and mirrors responses through authorized `FormApp` access after the organizer deploys the web app.
- All local font, image, and QR references were checked for existing files, including the supplied boarding-pass background, chevron strip, barcode, and two QR crops.
- The site uses the supplied QR image crops directly and does not regenerate them. Verified map URLs in `js/config.js` add click-through links. Graduate, Stardos Stencil, and Roboto Mono are requested by the local Google Fonts stylesheet with system fallbacks.
- The passport opening now has a separate orientation-turn phase before the hinge flip; reduced-motion users receive the final readable state without the animation.
- The invitation inside now follows the supplied vertical reference format: the fixed portrait page stacks the aqua verse/map panel, blue SAVE THE DATE band, white details panel with the portrait baby photo and immigration stamp, and the blue character strip. The supplied portrait crop is used directly.
- The boarding pass follows the supplied corrected landscape reference: aqua map main panel, vertical barcode, QR pair, verse stub, gold passenger box, and visible GATE 2 / SEAT B3 block. The DOM pass is a fixed 1314 × 621 landscape canvas that scales as a whole on phones and desktop; it does not reflow into the overlapping portrait layout. The **Save Boarding Pass Photo** action exports the same 1414 × 680 landscape PNG at 2× backing resolution, with a data-URL fallback when `canvas.toBlob` is unavailable.
- Sound preference defaults to on for new visitors and begins after the first gesture to satisfy browser autoplay rules.
- Browser screenshot/export automation was attempted, but the managed runtime did not have a Playwright browser binary. Verify the final visual layout in Live Server on a desktop browser and a short mobile viewport before publishing.
- The live Apps Script endpoint and Google Form mirror still require deployment and authorization from the organizer's Google account, then the `/exec` URL must be added to `js/config.js`.
