/**
 * Deploy from the organizer's Google Sheet (Extensions > Apps Script).
 * Execute as: Me. Access: Anyone. Paste the /exec URL into js/config.js.
 * Saves to a dedicated sheet and mirrors the same RSVP into the supplied
 * Google Form after the organizer authorizes FormApp during deployment.
 * See README.md for the one-time deployment step.
 */
var SHEET_NAME = 'Dedication RSVPs';
// This is the form ID from the supplied responder URL. The /d/e/ responder
// URL and /d/ edit URL use the same form ID; FormApp still requires the
// organizer to authorize access when the web app is first deployed.
var GOOGLE_FORM_EDIT_ID = '1FAIpQLScAuOmAzvQ6JNdb-mUTfGfAYw9mp9Uvv7SWZkjbxv_TO3Xx4w';

function doGet() {
  return finish({ success: true, service: 'Mateo dedication RSVP' });
}
function safeText(value, max) {
  var s = String(value || '').trim();
  if (s.length > max) throw new Error('Field too long');
  // Treat submitted text as text rather than spreadsheet formulas.
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || e.postData.contents.length > 12000) throw new Error('Invalid request');
    var d = JSON.parse(e.postData.contents);
    var name = safeText(d.name, 120);
    var phone = safeText(d.phone, 40);
    var companions = safeText(d.companions, 1000);
    var attend = String(d.attend || '');
    var requestId = String(d.requestId || '');
    if (!name || !/^[a-zA-Z0-9-]{10,80}$/.test(requestId)) throw new Error('Invalid name or request reference');
    if (['Yes, I will attend', 'Sorry, cannot attend'].indexOf(attend) < 0) throw new Error('Invalid attendance');
    var declined = attend === 'Sorry, cannot attend';
    var count = declined ? '0' : String(d.guestCount || '');
    var allowed = ['Just me','1','2','3','4','5','6','7','8','9','10','11 or more'];
    if (!declined && allowed.indexOf(count) < 0) throw new Error('Invalid guest count');
    var total = declined ? 0 : count === 'Just me' ? 1 : count === '11 or more' ? '12+' : Number(count) + 1;
    if (!lock.tryLock(10000)) throw new Error('Busy, please retry');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Bind this script to the organizer spreadsheet');
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Request ID','Ticket','Saved At','Full Name','Contact Number','Will Attend','Additional Guests','Total Including Respondent','Companions','Form Mirror']);
      sheet.setFrozenRows(1);
    }
    // A retry after a lost response returns the original ticket, without a second row.
    var prior = sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(requestId).matchEntireCell(true).findNext() : null;
    if (prior) return finish({ success: true, ticket: String(sheet.getRange(prior.getRow(),2).getValue()), duplicate: true });
    var ticket = Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase();
    sheet.appendRow([requestId,ticket,new Date(),name,phone,attend,count,total,declined ? '' : companions,GOOGLE_FORM_EDIT_ID ? 'Pending' : 'Not configured']);
    SpreadsheetApp.flush();
    if (GOOGLE_FORM_EDIT_ID) {
      try {
        mirrorForm(d, declined);
        sheet.getRange(sheet.getLastRow(),10).setValue('Saved');
      } catch (mirrorError) {
        // Sheet is authoritative. A mirroring failure must not duplicate a saved RSVP.
        sheet.getRange(sheet.getLastRow(),10).setValue('Needs organizer review');
      }
    }
    return finish({ success: true, ticket: ticket });
  } catch (err) {
    return finish({ success: false, error: 'Could not save RSVP. Verify the fields and retry.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
function mirrorForm(d, declined) {
  var form = FormApp.openById(GOOGLE_FORM_EDIT_ID);
  var response = form.createResponse();
  var values = {
    'Full Name': String(d.name || '').trim(),
    'Contact Number (optional)': String(d.phone || '').trim(),
    'Will you attend?': d.attend,
    'How many guests are coming with you?': declined ? 'Just me' : d.guestCount,
    'Names of your companions (optional)': declined ? '' : String(d.companions || '').trim()
  };
  // The published form requires a guest-count choice even for declines.
  // "Just me" satisfies that form's choices; Will Attend remains "cannot attend".
  form.getItems().forEach(function(item) {
    var title = item.getTitle();
    if (!Object.prototype.hasOwnProperty.call(values,title)) return;
    var v = values[title];
    if (item.getType() === FormApp.ItemType.TEXT) response.withItemResponse(item.asTextItem().createResponse(v));
    else if (item.getType() === FormApp.ItemType.PARAGRAPH_TEXT) response.withItemResponse(item.asParagraphTextItem().createResponse(v));
    else if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) response.withItemResponse(item.asMultipleChoiceItem().createResponse(v));
  });
  response.submit();
}
function finish(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
