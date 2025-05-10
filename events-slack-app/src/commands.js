// commands.js


const { fetchEvents, appendEvent, updateEvent } = require('./sheetsClient');

// Helper to format a Date in America/New_York as "YYYY-MM-DDTHH:mm:ss"
function toEtIso(date) {
  // Use Canadian format for easy ISO output, then replace space with 'T'
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(date).replace(' ', 'T');
}

/**
 * Handler for the /list-events slash command.
 * Fetches events from the Google Sheet and responds with a formatted list.
 */
async function listEvents({ command, ack, respond }) {
  // Acknowledge the command request
  await ack();

  let events;
  try {
    events = await fetchEvents();
  } catch (err) {
    console.error('Error fetching events from Sheets:', err);
    return respond({
      text: '❌ Failed to fetch events. Please try again later.',
      response_type: 'ephemeral',
    });
  }

  if (!events.length) {
    return respond({
      text: 'No events found in the directory.',
      response_type: 'ephemeral',
    });
  }

  // Build Block Kit message sections
  const blocks = events.map(e => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${e['Event Name']}*  —  \`${e.ID}\`  (${e['Publish State'] || 'unknown'})`
    }
  }));

  // Send the response
  await respond({
    blocks,
    response_type: 'ephemeral'
  });
}

/**
 * Handler for the /create-event slash command.
 * Opens a Slack modal for creating a new event.
 */

async function createEvent({ command, ack, client }) {
  console.log('​⚡️ /create-event handler hit', { trigger: command.trigger_id });
  await ack();
  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'create-event-view',
        title: { type: 'plain_text', text: 'Create Event' },
        submit: { type: 'plain_text', text: 'Create' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'input',
            block_id: 'name',
            label: { type: 'plain_text', text: 'Event Name' },
            element: { type: 'plain_text_input', action_id: 'value' }
          },
          {
            type: 'input',
            block_id: 'type',
            label: { type: 'plain_text', text: 'Event Type' },
            element: {
              type: 'static_select',
              action_id: 'value',
              options: [
                { text: { type: 'plain_text', text: 'In Person' }, value: 'In Person' },
                { text: { type: 'plain_text', text: 'Online' }, value: 'Online' },
                { text: { type: 'plain_text', text: 'Hybrid' }, value: 'Hybrid' }
              ]
            }
          },
          {
            type: 'input',
            block_id: 'start',
            label: { type: 'plain_text', text: 'Start Time' },
            element: { type: 'datetimepicker', action_id: 'value' }
          },
          {
            type: 'input',
            block_id: 'end',
            label: { type: 'plain_text', text: 'End Time' },
            element: { type: 'datetimepicker', action_id: 'value' }
          },
          {
            type: 'input',
            block_id: 'venue',
            label: { type: 'plain_text', text: 'Venue Key' },
            element: { type: 'plain_text_input', action_id: 'value' }
          },
          {
            type: 'input',
            block_id: 'description',
            label: { type: 'plain_text', text: 'Description' },
            element: { type: 'plain_text_input', action_id: 'value', multiline: true }
          },
          {
            type: 'input',
            block_id: 'host',
            label: { type: 'plain_text', text: 'Host Name' },
            element: { type: 'plain_text_input', action_id: 'value' }
          },
          {
            type: 'input',
            block_id: 'publish',
            label: { type: 'plain_text', text: 'Publish State' },
            element: {
              type: 'static_select',
              action_id: 'value',
              options: [
                { text: { type: 'plain_text', text: 'Draft' }, value: 'Draft' },
                { text: { type: 'plain_text', text: 'Published' }, value: 'Published' }
              ]
            }
          },
          {
            type: 'input',
            block_id: 'imageUrl',
            label: { type: 'plain_text', text: 'Image URL' },
            optional: true,
            element: { type: 'plain_text_input', action_id: 'value' }
          },
          {
            type: 'input',
            block_id: 'buttonEnabled',
            label: { type: 'plain_text', text: 'Enable Button?' },
            optional: true,
            element: {
              type: 'static_select',
              action_id: 'value',
              options: [
                { text: { type: 'plain_text', text: 'Yes' }, value: 'true' },
                { text: { type: 'plain_text', text: 'No' },  value: 'false' }
              ]
            }
          },
          {
            type: 'input',
            block_id: 'buttonText',
            label: { type: 'plain_text', text: 'Button Text' },
            optional: true,
            element: { type: 'plain_text_input', action_id: 'value' }
          },
          {
            type: 'input',
            block_id: 'buttonLink',
            label: { type: 'plain_text', text: 'Button Link' },
            optional: true,
            element: { type: 'plain_text_input', action_id: 'value' }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error opening create-event modal:', error);
  }
}

/**
 * Handler for the /edit-event slash command.
 * Opens a modal pre-filled with the event’s current data.
 */
async function editEvent({ command, ack, respond, client }) {
  await ack();
  const id = command.text.trim();
  let events;
  try {
    events = await fetchEvents();
  } catch (err) {
    console.error('Error fetching events for edit:', err);
    return respond({
      text: `❌ Couldn't load events. Try again later.`,
      response_type: 'ephemeral'
    });
  }
  const event = events.find(e => e.ID === id);
  if (!event) {
    return respond({
      text: `❌ No event found with ID \`${id}\`.`,
      response_type: 'ephemeral'
    });
  }

  // Parse and validate epoch seconds for datetimepicker initial values
  const msStart = Date.parse(event['Start Time']);
  const startEpoch = Number.isFinite(msStart) ? Math.floor(msStart / 1000) : null;
  const msEnd = Date.parse(event['End Time']);
  const endEpoch = Number.isFinite(msEnd) ? Math.floor(msEnd / 1000) : null;

  // (No longer need origStart/origEnd; show raw sheet values in context blocks)

  // Open pre-filled edit modal
  await client.views.open({
    trigger_id: command.trigger_id,
    private_metadata: JSON.stringify({ ID: event.ID, RowIndex: event.RowIndex }),
    view: {
      type: 'modal',
      callback_id: 'edit-event-view',
      title: { type: 'plain_text', text: 'Edit Event' },
      submit: { type: 'plain_text', text: 'Save' },
      close: { type: 'plain_text', text: 'Cancel' },
      blocks: [
        {
          type: 'input',
          block_id: 'name',
          label: { type: 'plain_text', text: 'Event Name' },
          element: {
            type: 'plain_text_input',
            action_id: 'value',
            initial_value: event['Event Name']
          }
        },
        {
          type: 'input',
          block_id: 'type',
          label: { type: 'plain_text', text: 'Event Type' },
          element: {
            type: 'static_select',
            action_id: 'value',
            initial_option: {
              text: { type: 'plain_text', text: event['Event Type'] },
              value: event['Event Type']
            },
            options: [
              { text: { type: 'plain_text', text: 'In Person' }, value: 'In Person' },
              { text: { type: 'plain_text', text: 'Online' }, value: 'Online' },
              { text: { type: 'plain_text', text: 'Hybrid' }, value: 'Hybrid' }
            ]
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'plain_text',
              text: `Original Start: ${event['Start Time'] || '—'}`,
              emoji: true
            }
          ]
        },
        {
          type: 'input',
          optional: true,
          block_id: 'start',
          label: { type: 'plain_text', text: 'Start Time' },
          element: {
            type: 'datetimepicker',
            action_id: 'value',
            ...(Number.isInteger(startEpoch) ? { initial_date_time: startEpoch } : {})
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'plain_text',
              text: `Original End: ${event['End Time'] || '—'}`,
              emoji: true
            }
          ]
        },
        {
          type: 'input',
          optional: true,
          block_id: 'end',
          label: { type: 'plain_text', text: 'End Time' },
          element: {
            type: 'datetimepicker',
            action_id: 'value',
            ...(Number.isInteger(endEpoch) ? { initial_date_time: endEpoch } : {})
          }
        },
        {
          type: 'input',
          block_id: 'venue',
          label: { type: 'plain_text', text: 'Venue Key' },
          element: {
            type: 'plain_text_input',
            action_id: 'value',
            initial_value: event['Venue Key']
          }
        },
        {
          type: 'input',
          block_id: 'description',
          label: { type: 'plain_text', text: 'Description' },
          element: {
            type: 'plain_text_input',
            action_id: 'value',
            multiline: true,
            initial_value: event['Description']
          }
        },
        {
          type: 'input',
          block_id: 'host',
          label: { type: 'plain_text', text: 'Host Name' },
          element: {
            type: 'plain_text_input',
            action_id: 'value',
            initial_value: event['Host']
          }
        },
        {
          type: 'input',
          block_id: 'publish',
          label: { type: 'plain_text', text: 'Publish State' },
          element: {
            type: 'static_select',
            action_id: 'value',
            initial_option: {
              text: { type: 'plain_text', text: event['Publish State'] },
              value: event['Publish State']
            },
            options: [
              { text: { type: 'plain_text', text: 'Draft' }, value: 'Draft' },
              { text: { type: 'plain_text', text: 'Published' }, value: 'Published' }
            ]
          }
        },
        // include any optional blocks as needed...
      ]
    }
  });
}

/**
 * Listener for submissions of the create-event modal.
 * Writes the new event to the Google Sheet.
 */
async function handleCreateEventSubmission({ ack, body, client }) {
  console.log('⚡️ handleCreateEventSubmission hit', body.view.callback_id, body.user.id);
  await ack();
  const values = body.view.state.values;
  const newEvent = {
    'Event Name': values.name.value.value,
    'Event Type': values.type.value.selected_option.value,
    'Start Time': toEtIso(new Date(values.start.value.selected_date_time * 1000)),
    'End Time':   toEtIso(new Date(values.end.value.selected_date_time * 1000)),
    'Venue Key': values.venue.value.value,
    'Description': values.description.value.value,
    'Host': values.host.value.value,
    'Publish State': values.publish.value.selected_option.value,
    'Image URL':   values.imageUrl.value.value || '',
    'Button Enabled': values.buttonEnabled.value.selected_option.value === 'true',
    'Button Text':   values.buttonText.value.value || '',
    'Button Link':   values.buttonLink.value.value || ''
  };
  // Call your Sheets client to append the row
  try {
    const { appendEvent } = require('./sheetsClient');
    await appendEvent(newEvent);
    await client.chat.postMessage({
      channel: body.user.id,
      text: `✅ Event *${newEvent['Event Name']}* created with ID: \`${newEvent.ID}\``
    });
  } catch (error) {
    console.error('Error appending new event to Sheets:', error);
    await client.chat.postMessage({
      channel: body.user.id,
      text: '❌ There was an error creating your event. Please try again.'
    });
  }
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
  const updatedEvent = {
    RowIndex: meta.RowIndex,
    ID: meta.ID,
    'Event Name': values.name.value.value,
    'Event Type': values.type.value.selected_option.value,
    // Use new pick if provided, otherwise keep original
    'Start Time': values.start.value.selected_date_time
      ? toEtIso(new Date(values.start.value.selected_date_time * 1000))
      : originalEvent['Start Time'],
    'End Time':   values.end.value.selected_date_time
      ? toEtIso(new Date(values.end.value.selected_date_time * 1000))
      : originalEvent['End Time'],
    'Venue Key':      values.venue.value.value,
    'Description':    values.description.value.value,
    'Host':           values.host.value.value,
    'Publish State':  values.publish.value.selected_option.value,
    'Image URL':      values.imageUrl?.value.value || '',
    'Button Enabled': values.buttonEnabled?.value.selected_option.value === 'true',
    'Button Text':    values.buttonText?.value.value || '',
    'Button Link':    values.buttonLink?.value.value || ''
  };
  try {
    await updateEvent(updatedEvent);
    await client.chat.postMessage({
      channel: body.user.id,
      text: `✅ Event *${updatedEvent['Event Name']}* updated.`
    });
  } catch (error) {
    console.error('Error updating event in Sheets:', error);
    await client.chat.postMessage({
      channel: body.user.id,
      text: '❌ There was an error saving your changes. Please try again.'
    });
  }
}

module.exports = {
  listEvents,
  createEvent,
  handleCreateEventSubmission,
  editEvent,
  handleEditEventSubmission
};