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
    range: 'Events Master!A2:N'
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
    'Button Link',
    'RowIndex'
  ];
  return rows.map(r => Object.fromEntries(
    headers.map((h, i) => [h, h === 'RowIndex' ? parseInt(r[i], 10) : r[i]])
  ));
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
    eventObj['Publish State'] || 'FALSE',
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
 * Listener for the edit-event modal submission.
 * Updates the event row in the sheet.
 */
async function handleEditEventSubmission({ ack, body, client }) {
  await ack();
  const values = body.view.state.values;
  // Retrieve original event for fallback values
  const meta = JSON.parse(body.view.private_metadata);
  const allEvents = await fetchEvents();
  const originalEvent = allEvents.find(e => e.ID === meta.ID);

  // Normalize original Start Time (handle comma‑separated formats)
  const rawOrigStart = (originalEvent['Start Time'] || '').replace(/,/g, '');
  const msOrigStart = Date.parse(rawOrigStart);
  const normalizedOrigStart = Number.isFinite(msOrigStart)
    ? toEtIso(new Date(msOrigStart))
    : originalEvent['Start Time'];

  // Normalize original End Time
  const rawOrigEnd = (originalEvent['End Time'] || '').replace(/,/g, '');
  const msOrigEnd = Date.parse(rawOrigEnd);
  const normalizedOrigEnd = Number.isFinite(msOrigEnd)
    ? toEtIso(new Date(msOrigEnd))
    : originalEvent['End Time'];

  // Get selected values from the modal
  const selectedPublishState = values.publish.value.selected_option.value;
  const selectedButtonEnabled = values.buttonEnabled.value.selected_option.value;
  
  // Convert "Published"/"Draft" to boolean true/false for the sheet
  const publishState = selectedPublishState === 'Published';
  
  // Convert "true"/"false" string to boolean for Button Enabled
  const buttonEnabled = selectedButtonEnabled === 'true';

  console.log('Selected publish state:', selectedPublishState, '→', publishState);
  console.log('Selected button enabled:', selectedButtonEnabled, '→', buttonEnabled);

  const updatedEvent = {
    RowIndex: meta.RowIndex,
    ID: meta.ID,
    'Event Name': values.name.value.value,
    'Event Type': values.type.value.selected_option.value,
    // Use new pick if provided, otherwise keep original (normalized)
    'Start Time': values.start.value.selected_date_time
      ? toEtIso(new Date(values.start.value.selected_date_time * 1000))
      : normalizedOrigStart,
    'End Time':   values.end.value.selected_date_time
      ? toEtIso(new Date(values.end.value.selected_date_time * 1000))
      : normalizedOrigEnd,
    'Venue Key':      values.venue.value.selected_option.value,
    'Description':    values.description.value.value,
    'Host':           values.host.value.value,
    'Publish State':  publishState, // Should be a boolean now
    'Image URL':      values.imageUrl?.value.value || '',
    'Button Enabled': buttonEnabled, // Should be a boolean now
    'Button Text':    values.buttonText?.value.value || '',
    'Button Link':    values.buttonLink?.value.value || ''
  };

  try {
    console.log('Publishing event with publish state:', updatedEvent['Publish State']);
    await updateEvent(updatedEvent);
    await client.chat.postMessage({
      channel: body.user.id,
      text: `✅ Event *${updatedEvent['Event Name']}* updated. Publish State: ${publishState ? 'Published' : 'Draft'}`
    });
  } catch (error) {
    console.error('Error updating event in Sheets:', error);
    await client.chat.postMessage({
      channel: body.user.id,
      text: `❌ There was an error saving your changes. Please try again. Error: ${error.message}`
    });
  }
}

/**
 * Fetches all venue rows from the "Venues" sheet and returns them as objects.
 */
async function fetchVenues() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Venues!A2:H'
  });
  const rows = res.data.values || [];
  const headers = [
    'Key',
    'Display Name',
    'Card BG Color',
    'BG Color',
    'Card Text Color',
    'Text Color',
    'Address',
    'Map URL'
  ];
  return rows.map(r => Object.fromEntries(
    headers.map((h, i) => [h, r[i] || ''])
  ));
}

module.exports = { fetchEvents, appendEvent, updateEvent, fetchVenues };
