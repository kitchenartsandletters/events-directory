// ===== events.js =====

// Confirm the script is loading
console.log('events.js loaded');

// ===== CONFIG =====
// Replace this with your actual Apps Script Web App exec URL:
const JSON_FEED_URL = 'https://script.google.com/macros/s/AKfycbxTNWRJYMgTsmP_woW55bDztY4wHc2wnbut9Ht4cDUdcdHVGCzgs5Xo2WbvRLpqJtUxgw/exec';

// JSONP callback invoked by the injected script
window.handleEvents = function(rawEvents) {
  console.log('handleEvents called with events:', rawEvents);

  const now = new Date();

  // Parse dates, filter for future events, and sort chronologically
  const events = rawEvents
    .map(e => ({
      ...e,
      start: new Date(e['Start Time']),
      end:   new Date(e['End Time'])
    }))
    .filter(e => e.start >= now)
    .sort((a, b) => a.start - b.start);

  const container = document.getElementById('events-container');
  container.innerHTML = '';

  if (events.length === 0) {
    container.innerHTML = '<p>No upcoming events.</p>';
    return;
  }

  events.forEach(e => {
    const card = document.createElement('div');
    card.className = `event-card venue-${e.Venue.replace(/\s+/g,'-').toLowerCase()}`;

    if (e['Custom Event Color']) {
      card.style.setProperty('--bg', e['Custom Event Color']);
    }

    // Build the inner HTML
    let html = '';

    if (e.Image) {
      html += `<img class="event-image" src="${e.Image}" alt="${e['Event Name']}">`;
    }

    html += `
      <div class="event-header">
        <h3>${e['Event Name']}</h3>
        <time>${formatDateTime(e.start, e.end, e['All Day'], e['Time Zone'])}</time>
      </div>
      <p>${e.Description}</p>
    `;

    if (e['Button Enabled'] === 'TRUE') {
      html += `<a class="event-btn" href="${e['Button Link']}">${e['Button Text']}</a>`;
    }

    card.innerHTML = html;
    container.appendChild(card);
  });
};

// Inject the JSONP <script> tag to call our callback
(function loadEvents() {
  const src = JSON_FEED_URL + '?callback=handleEvents';
  console.log('Injecting JSONP script:', src);

  const s = document.createElement('script');
  s.src = src;
  s.onerror = () => console.error('JSONP load failed:', src);
  document.body.appendChild(s);
})();

// Helper to format date/times
function formatDateTime(start, end, allDay, tz) {
  if (allDay === 'TRUE') {
    return 'All day';
  }
  const opts = {
    timeZone: tz,
    month:    'short',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false
  };
  const startStr = start.toLocaleString(undefined, opts);
  const endStr   = end.toLocaleString(undefined, opts);
  return `${startStr} – ${endStr}`;
}