// ===== events.js =====

// Helper to darken a hex color by a percentage (0–1)
function darkenHex(hex, pct) {
  hex = hex.replace(/^#/, '');
  const num = parseInt(hex, 16);
  let r = (num >> 16) & 0xFF;
  let g = (num >> 8)  & 0xFF;
  let b = num & 0xFF;
  r = Math.round(r * (1 - pct));
  g = Math.round(g * (1 - pct));
  b = Math.round(b * (1 - pct));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1);
};

// Helper to increase the saturation of a hex color by a percentage (0–1)
function saturateHex(hex, pct) {
  hex = hex.replace(/^#/, '');
  // Convert hex to RGB
  let num = parseInt(hex, 16);
  let r = (num >> 16) & 0xFF;
  let g = (num >> 8) & 0xFF;
  let b = num & 0xFF;
  // Convert RGB to HSL
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  // Increase saturation (additive)
  s = Math.min(1, s + pct);
  // Convert HSL back to RGB
  let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  let p = 2 * l - q;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  r = hue2rgb(p, q, h + 1/3);
  g = hue2rgb(p, q, h);
  b = hue2rgb(p, q, h - 1/3);
  // Return hex
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Helper to get the saturation (0–1) of a hex color
function getSaturation(hex) {
  hex = hex.replace(/^#/, '');
  const num = parseInt(hex, 16);
  let r = ((num >> 16) & 0xFF) / 255;
  let g = ((num >> 8) & 0xFF) / 255;
  let b = (num & 0xFF) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

// Confirm the script is loading
console.log('events.js loaded');

// ===== CONFIG =====
// Replace this with your actual Apps Script Web App exec URL:
const JSON_FEED_URL = 'https://script.google.com/macros/s/AKfycbxTNWRJYMgTsmP_woW55bDztY4wHc2wnbut9Ht4cDUdcdHVGCzgs5Xo2WbvRLpqJtUxgw/exec';

// JSONP callback invoked by the injected script
window.handleEvents = function(payload) {
  console.log('handleEvents called with payload:', payload);
  const rawEvents = payload.events || [];
  const venues    = payload.venues  || [];
  console.log('venues:', venues);

  const now = new Date();

  // Parse dates, filter for future events, filter out events without image, and sort chronologically
  const events = rawEvents
    .map(e => ({
      ...e,
      start: new Date(e['Start Time']),
      end:   new Date(e['End Time'])
    }))
    .filter(e => e.start >= now)
    .filter(e => e['Image URL'])
    .sort((a, b) => a.start - b.start);

  const container = document.getElementById('events-container');
  container.innerHTML = '';

  if (events.length === 0) {
    container.innerHTML = '<p>No upcoming events.</p>';
    return;
  }

  events.forEach(e => {
  // Expose venues globally for use in the modal
  window.venues = venues;
    // Lookup this event’s venue metadata from the Venues payload
    const venueMeta = venues.find(v => v.Key === e['Venue Key']) || {};
    // Determine the raw background value (custom overrides venue default)
    let baseBgRaw = e['Custom Event Color'] || venueMeta['Card BG Color'] || '';
    // Validate it’s a proper 6‑digit hex; otherwise default to white
    const validHex = /^#[0-9A-Fa-f]{6}$/.test(baseBgRaw);
    const baseBg = validHex ? baseBgRaw : '#ffffff';
    // Determine pill color: use brand accent for near-gray or boost saturation
    const sat = getSaturation(baseBg);
    let pillBg;
    if (sat < 0.05) {
      // Gray background → use brand accent
      pillBg = '#cdcccc';
    } else {
      // Colored background → boost saturation by 50%
      pillBg = saturateHex(baseBg, 1);
    }
    console.log(
      '🏷️ event:', e['Event Name'],
      'venueMeta.Card BG Color=', venueMeta['Card BG Color'],
      'Custom Event Color=', e['Custom Event Color'],
      '→ baseBg=', baseBg,
      '→ pillBg=', pillBg
    );
    const card = document.createElement('div');
    // Expose pill background via CSS variable
    card.style.setProperty('--pill-bg', pillBg);
    // Compute button background: 10% darker than the card background
    const btnBg = darkenHex(baseBg, 0.1);
    const venueKey = (e['Venue Key'] || '').replace(/\s+/g, '-').toLowerCase();
    // Apply card‐level color overrides from the Venues sheet
    if (venueMeta['Card BG Color']) {
      card.style.setProperty('--bg', venueMeta['Card BG Color']);
    }
    if (venueMeta['Card Text Color']) {
      card.style.setProperty('--fg', venueMeta['Card Text Color']);
    }
    card.className = `event-card venue-${venueKey}`;

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

    const imageUrl = (e['Image URL'] || '').replace(/\?.*$/, '');
    if (imageUrl) {
      html += `<img class="event-image" src="${imageUrl}" alt="${e['Event Name']}">`;
    }

    html += `
      <div class="event-content">
        <div class="event-type">
          ${e['Event Type'].toUpperCase()}
        </div>
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
          ${venueMeta['Display Name'] || e['Venue Key']}
        </div>
        ${(e['Button Enabled'] && e['Button Text'] && e['Button Link'])
          ? `<a class="event-btn" style="background: ${btnBg}" href="${e['Button Link']}">${e['Button Text']}</a>`
          : ''}
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

  // Find venues array from window.venues (now always exposed globally)
  const venues = window.venues || [];
  // Lookup this event’s venue metadata from the Venues payload
  const venueMeta = (Array.isArray(venues) ? venues.find(v => v.Key === e['Venue Key']) : null) || {};

  // Populate fields
  title.textContent = e['Event Name'];
  // Meta: WHEN, WHERE, HOST, divider, SHARE
  const month     = e.start.toLocaleString(undefined, { month: 'long', day: 'numeric' });
  const timeOpts  = { timeZone: e['Time Zone'], hour: 'numeric', minute: '2-digit', hour12: true };
  const timeStr   = e.start.toLocaleString(undefined, timeOpts);

  // WHEN block
  meta.innerHTML = `
    <div class="modal-block modal-when">
      <span class="modal-block-label">WHEN</span>
      <div class="modal-block-value">${month}, ${timeStr}</div>
      <a href="#" class="modal-add-calendar">+ Add to Calendar</a>
    </div>
    <div class="modal-block modal-where">
      <span class="modal-block-label">WHERE</span>
      <a href="${venueMeta['Map URL'] || '#'}" target="_blank" class="modal-block-value">
        ${venueMeta['Display Name'] || e['Venue Key']}
      </a>
      <div class="modal-block-subvalue">${venueMeta.Address || ''}</div>
    </div>
  `;

  // Embed map iframe
  const mapEmbedUrl = (venueMeta['Map URL'] || '').replace('/maps', '/maps/embed');
  if (mapEmbedUrl) {
    meta.innerHTML += `
      <div class="modal-map-container">
        <iframe
          src="${mapEmbedUrl}"
          width="100%" height="200" style="border:0;"
          allowfullscreen="" loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    `;
  }

  // HOST block
  meta.innerHTML += `
    <div class="modal-block modal-host">
      <span class="modal-block-label">HOST</span>
      <div class="modal-block-value">${e['Host'] || ''}</div>
    </div>
  `;

  // Divider
  meta.innerHTML += `<hr class="modal-divider" />`;

  // SHARE actions
  meta.innerHTML += `
    <div class="modal-block modal-share">
      <span class="modal-block-label">SHARE</span>
      <button class="modal-btn modal-copy-link" title="Copy link">
        <svg width="16" height="16" aria-hidden="true"><path d="M3 8a3 3 0 0 1 3-3h4v1H6a2 2 0 0 0-2 2v4h1V8z"/><path d="M5 13a3 3 0 0 1-3-3V6h1v4a2 2 0 0 0 2 2h4v1H5z"/><path d="M8 3h4a3 3 0 0 1 3 3v4h-1V6a2 2 0 0 0-2-2H8V3z"/><path d="M13 11a3 3 0 0 1 3 3v4h-1v-4a2 2 0 0 0-2-2h-4v-1h4z"/></svg>
      </button>
      <button class="modal-btn modal-invite-email" title="Invite via Email">
        <svg width="16" height="16" aria-hidden="true"><path d="M2 4h12v2H2zm0 4h12v2H2zm0 4h12v2H2z"/></svg>
      </button>
    </div>
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