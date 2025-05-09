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

    const month = e.start.toLocaleString(undefined, { month: 'short' });
    const day = e.start.getDate();
    // Time formatting: show start only, or start–end if both present
    const timeOptions = {
      timeZone: e['Time Zone'],
      hour:     'numeric',
      minute:   '2-digit',
      hour12:   true
    };
    const startTimeStr = e.start.toLocaleString(undefined, timeOptions);
    let timeHtml = startTimeStr;
    if (e.end) {
      const endTimeStr = e.end.toLocaleString(undefined, timeOptions);
      timeHtml = `${startTimeStr} – ${endTimeStr}`;
    }

    // For teaser, only show the start time
    const teaserTime = startTimeStr;

    // Build the inner HTML for the card
    let html = `
      <div class="event-date-block">
        <div class="event-date-month">${month}</div>
        <div class="event-date-day">${day}</div>
      </div>
    `;

    if (e.Image) {
      html += `<img class="event-image" src="${e.Image}" alt="${e['Event Name']}">`;
    }

    html += `
      <div class="event-content">
        <div class="event-type">${e['Event Type'].toUpperCase()}</div>
        <h3 class="event-name">${e['Event Name']}</h3>
        <div class="event-time">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 1a11 11 0 1 0 11 11A11.012 11.012 0 0 0 12 1zm0 20a9 9 0 1 1 9-9 9.01 9.01 0 0 1-9 9zm.5-9.5h5v1h-4.5V6h1z"/>
          </svg>
          ${teaserTime}
        </div>
        <div class="event-venue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>
          ${e.Venue}
        </div>
        ${e['Button Enabled'] ? `<a class="event-btn" href="${e['Button Link']}">${e['Button Text']}</a>` : ''}
      </div>
    `;
    card.innerHTML = html;
    container.appendChild(card);
  
    // Make card clickable to open detail modal
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      console.log('card clicked:', e);
      showEventModal(e);
    });
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

// ===== Modal Markup Injection =====
const modalHtml = `
  <div id="event-modal-overlay" class="hidden">
    <div id="event-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" aria-label="Close">&times;</button>
      <div class="modal-content">
        <h2 id="modal-title"></h2>
        <div class="modal-meta"></div>
        <img class="modal-image" src="" alt="" />
        <div class="modal-description"></div>
        <div class="modal-actions"></div>
      </div>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', modalHtml);

// ===== Modal Show/Hide Logic =====
function showEventModal(e) {
  const overlay = document.getElementById('event-modal-overlay');
  const title   = document.getElementById('modal-title');
  const meta    = document.querySelector('.modal-meta');
  const img     = document.querySelector('.modal-image');
  const desc    = document.querySelector('.modal-description');
  const actions = document.querySelector('.modal-actions');

  // Populate fields
  title.textContent = e['Event Name'];
  // Meta: type, venue, date/time
  const month     = e.start.toLocaleString(undefined, { month: 'long', day: 'numeric' });
  const timeOpts  = { timeZone: e['Time Zone'], hour: 'numeric', minute: '2-digit', hour12: true };
  const timeStr   = e.start.toLocaleString(undefined, timeOpts);
  meta.innerHTML  = `
    <div class="event-type">${e['Event Type']}</div>
    <div class="event-venue">${e.Venue}</div>
    <div class="event-date-full">${month}</div>
    <div class="event-time-full">${timeStr}</div>
  `;
  img.src = e.Image || '';
  img.alt = e['Event Name'];
  desc.textContent = e.Description;

  // Actions (e.g., RSVP button)
  actions.innerHTML = '';
  if (e['Button Enabled'] === 'TRUE') {
    actions.innerHTML = `<a class="event-btn" href="${e['Button Link']}">${e['Button Text']}</a>`;
  }

  // Show modal: remove hidden, add active
  overlay.classList.remove('hidden');
  overlay.classList.add('active');
}

// Close modal on clicking the close button or overlay
document.body.addEventListener('click', (evt) => {
  if (evt.target.matches('.modal-close') || evt.target.id === 'event-modal-overlay') {
    const overlay = document.getElementById('event-modal-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('active');
  }
});

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