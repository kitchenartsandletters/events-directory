// sheetsClient.js

const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

let sheetsClient;

/**
 * Initialize and cache a Google Sheets API client using service account credentials.
 */
async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Fetches all event rows from the "Events Master" sheet and returns them as objects.
 */
async function fetchEvents() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Events Master!A2:M'
  });
  const rows = res.data.values || [];
  const headers = [
    'ID',
    'Event Name',
    'Event Type',
    'Start Time',
    'End Time',
    'Venue Key',
    'Description',
    'Image URL',
    'Host',
    'Publish State',
    'Button Enabled',
    'Button Text',
    'Button Link'
  ];
  return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

/**
 * Appends a new event object as a row in the "Events Master" sheet.
 * Generates a unique ID, writes the row, and returns the new ID.
 */
async function appendEvent(eventObj) {
  const sheets = await getSheetsClient();
  // Assign a unique ID
  const id = uuidv4();
  // Build the row in the correct column order
  const row = [
    id,
    eventObj['Event Name'],
    eventObj['Event Type'],
    eventObj['Start Time'],
    eventObj['End Time'],
    eventObj['Venue Key'],
    eventObj['Description'],
    eventObj['Image URL'] || '',
    eventObj['Host'] || '',
    eventObj['Publish State'] || 'Draft',
    eventObj['Button Enabled'] || false,
    eventObj['Button Text'] || '',
    eventObj['Button Link'] || ''
  ];
  // Append to the sheet and capture the result
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Events Master!A2:M',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [row] }
  });

  // Extract the new row index from the updatedRange (e.g., "Events Master!A5:M5")
  const updatedRange = res.data.updates.updatedRange;
  const match = updatedRange.match(/!A(\d+):/);
  const rowIndex = match ? parseInt(match[1], 10) : null;

  // If we have a valid rowIndex, write it into column N
  if (rowIndex) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Events Master!N${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[rowIndex]] }
    });
  }

  return id;
}


/**
 * Updates an existing event row in the "Events Master" sheet.
 * Expects eventObj.RowIndex (1-based, including header row) and the same keys as appendEvent.
 */
async function updateEvent(eventObj) {
  const sheets = await getSheetsClient();
  // Build the row in the correct column order
  const row = [
    eventObj.ID,
    eventObj['Event Name'],
    eventObj['Event Type'],
    eventObj['Start Time'],
    eventObj['End Time'],
    eventObj['Venue Key'],
    eventObj['Description'],
    eventObj['Image URL'] || '',
    eventObj['Host'] || '',
    eventObj['Publish State'] || 'Draft',
    eventObj['Button Enabled'] || false,
    eventObj['Button Text'] || '',
    eventObj['Button Link'] || ''
  ];
  // Calculate A1 range for the row (RowIndex should be the sheet row number)
  const range = `Events Master!A${eventObj.RowIndex}:M${eventObj.RowIndex}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });
}

module.exports = { fetchEvents, appendEvent, updateEvent };
