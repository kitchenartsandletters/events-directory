// ===== CONFIGURE =====
// Your Sheet’s ID (from the URL: https://docs.google.com/spreadsheets/d/<THIS_ID>/edit)
const SHEET_ID   = '1eUSKR3yqgi_2tzn5biumGQtLRPwkY_YUf1MQK1xOexI';
const SHEET_NAME = 'Events Master';

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
  // Filter to only include events marked as Published
  const publishedEvents = events.filter(evt => evt['Publish State'] === 'Published');
  // Read Venues sheet
  const vSheet  = ss.getSheetByName('Venues');
  const vData   = vSheet.getDataRange().getValues();
  const vHeaders= vData.shift();
  const venues  = vData.map(row => {
    const vObj = {};
    vHeaders.forEach((h, j) => vObj[h] = row[j]);
    return vObj;
  });
  const payloadObj = { events: publishedEvents, venues };
  const json       = JSON.stringify(payloadObj);
  const callback   = e.parameter.callback;
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
  const ss      = SpreadsheetApp.openById(SHEET_ID);
  const sheet   = ss.getSheetByName(SHEET_NAME);
  const range   = sheet.getDataRange();
  const values  = range.getValues();
  const headers = values.shift();
  const idCol   = headers.indexOf('ID');
  const startCol= headers.indexOf('Start Time');
  const stateCol= headers.indexOf('Publish State');
  const now     = new Date();
  
  let updatedRows = [];
  const newValues = values.map(row => {
    const start = new Date(row[startCol]);
    if (row[stateCol] === 'Published' && start < now) {
      row[stateCol] = 'Unpublished';
      updatedRows.push(row[idCol]);
    }
    return row;
  });
  
  if (updatedRows.length) {
    // Write updated states back to the sheet
    range.offset(1, 0, newValues.length, newValues[0].length).setValues(newValues);
    console.log('Unpublished events:', updatedRows);
  } else {
    console.log('No past events to unpublish.');
  }
}

/**
 * Creates a daily trigger at 2AM to run unpublishPastEvents.
 * Run this once manually via the Apps Script editor.
 */
function createUnpublishTrigger() {
  // Delete any existing unpublish triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'unpublishPastEvents') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // Create a new daily 2AM trigger
  ScriptApp.newTrigger('unpublishPastEvents')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .inTimezone('America/New_York')
    .create();
  console.log('Created daily unpublishPastEvents trigger at 2AM ET');
}