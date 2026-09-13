// Organizer settings. Keep scriptUrl empty until your Apps Script web app is deployed.
window.MATEO_CONFIG = {
    child: 'Mateo Gray',
    childFull: 'Mateo Gray D. Delos Santos',
    event: 'Dedication',
    dateLong: 'September 19, 2026',
    dateBoarding: '19 September 2026',
    dateShort: 'SEP 19, 2026',
    dateStamp: 'SEP 19 2026',
    dateStrip: '0919',
    time: '10:00 AM',
    timeInvitation: '10:00 IN THE MORNING',
    venueShort: 'JIACM Church',
    church: 'Jesus Is Alive Christian Ministry (JIACM)',
    reception: 'Kenny Rogers, Bacoor Junction',
    flight: 'MG-DDN-0919',
    boardingClass: 'Guest of Honor',
    verseRef: '1 Samuel 1:27\u201328',
    verseRight: 'Matthew 19:14',
    gate: '2',      // reference detail shown on the boarding pass
    seat: 'B3',     // reference detail shown on the boarding pass
    maps: {
      church: '',       // verified Google Maps link — enables QR
      reception: ''     // verified Google Maps link — enables QR
    },
    scriptUrl: '',       // Apps Script /exec Web App URL (see backend/Code.gs). Leave empty to use the
                         //   Apps Script-free direct Google Form POST below (hidden-iframe technique).
    formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScAuOmAzvQ6JNdb-mUTfGfAYw9mp9Uvv7SWZkjbxv_TO3Xx4w/viewform?usp=sharing&ouid=107088257804039774174',
    formResponse: 'https://docs.google.com/forms/d/e/1FAIpQLScAuOmAzvQ6JNdb-mUTfGfAYw9mp9Uvv7SWZkjbxv_TO3Xx4w/formResponse',
    fbzx: '-1215003312957695342',
    formEntries: {           // Google Form field IDs, in the order the RSVP form collects them
      name:        'entry.439322866',   // Full name
      phone:       'entry.1291513338',  // Contact number (optional)
      attend:      'entry.1037279626',  // Will you attend? (Yes / No)
      guests:      'entry.138376767',   // Number of guests
      companions:  'entry.1001559471'   // Name(s) of companions
    }
  };
