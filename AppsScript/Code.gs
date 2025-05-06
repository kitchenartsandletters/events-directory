// ===== CONFIGURE =====
// Your Sheet’s ID (from the URL: https://docs.google.com/spreadsheets/d/<THIS_ID>/edit)
const SHEET_ID   = '1d68hoZ-SbralpbobW-AU9QupKuIsOfAHC-8L9jVSaRQ';
const SHEET_NAME = 'Sheet1';

// ===== JSON FEED =====
function doGet(e) {
  const ss      = SpreadsheetApp.openById(SHEET_ID);
  const sheet   = ss.getSheetByName(SHEET_NAME);
  const data    = sheet.getDataRange().getValues();
  const headers = data.shift();
  const events  = data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  const json     = JSON.stringify(events);
  const callback = e.parameter.callback;
  if (callback) {
    // Return JSONP if a callback parameter is provided
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  // Fallback: return plain JSON
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== UNPUBLISH PAST EVENTS =====
function unpublishPastEvents() {
  // TODO: 
  // 1. Read sheet rows
  // 2. Compare Start Time < today
  // 3. Call Shopify Admin API to set published=false
  // 4. Update the sheet’s “Published” column
}