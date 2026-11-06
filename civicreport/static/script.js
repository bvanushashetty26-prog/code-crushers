/**
 * CivicReport – script.js
 * Page dispatch: runs the correct init function based on which page is loaded.
 */

/* ─── Page dispatch ────────────────────────────────────────────────── */
if (document.getElementById('reportForm'))    initReportPage();
if (document.getElementById('trackInput'))    initTrackPage();
if (document.getElementById('adminMap'))      initAdminPage();
if (document.getElementById('exploreCards'))  initExplorePage();

function initReportPage() {

  /* ── Element refs ──────────────────────────────────────────────── */
  const form             = document.getElementById('reportForm');
  const descEl           = document.getElementById('description');
  const submitBtn        = document.getElementById('submitBtn');
  const submitLabel      = document.getElementById('submitLabel');
  const submitSpinner    = document.getElementById('submitSpinner');
  const validationBanner = document.getElementById('validationBanner');
  const validationMsg    = document.getElementById('validationMsg');

  const imageInput       = document.getElementById('imageInput');
  const uploadZone       = document.getElementById('uploadZone');
  const uploadPrompt     = document.getElementById('uploadPrompt');
  const imagePreview     = document.getElementById('imagePreview');
  const removeImageBtn   = document.getElementById('removeImage');

  const geoBtn           = document.getElementById('geoBtn');
  const coordReadout     = document.getElementById('coordReadout');
  const latDisplay       = document.getElementById('latDisplay');
  const lngDisplay       = document.getElementById('lngDisplay');
  const clearPinBtn      = document.getElementById('clearPin');
  const latInput         = document.getElementById('latitude');
  const lngInput         = document.getElementById('longitude');

  const resultCard       = document.getElementById('resultCard');
  const resultTrackingId = document.getElementById('resultTrackingId');
  const copyBtn          = document.getElementById('copyBtn');
  const duplicateWarning = document.getElementById('duplicateWarning');
  const duplicateMsg     = document.getElementById('duplicateMsg');
  const resultCategory   = document.getElementById('resultCategory');
  const resultSummary    = document.getElementById('resultSummary');
  const resultPriorityBadge = document.getElementById('resultPriorityBadge');
  const factorsList      = document.getElementById('factorsList');
  const trackLink        = document.getElementById('trackLink');
  const newReportBtn     = document.getElementById('newReportBtn');

  /* ── Leaflet map ───────────────────────────────────────────────── */
  // Default centre: fictional Greenvale (28.62 N, 77.21 E)
  const DEFAULT_LAT = 28.620;
  const DEFAULT_LNG = 77.210;

  const map = L.map('map', { zoomControl: true }).setView([DEFAULT_LAT, DEFAULT_LNG], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  let marker = null;

  function placePin(lat, lng) {
    lat = parseFloat(lat.toFixed(6));
    lng = parseFloat(lng.toFixed(6));

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updateCoords(pos.lat, pos.lng);
      });
    }
    map.panTo([lat, lng]);
    updateCoords(lat, lng);
  }

  function updateCoords(lat, lng) {
    latInput.value = lat;
    lngInput.value = lng;
    latDisplay.textContent = lat.toFixed(5);
    lngDisplay.textContent = lng.toFixed(5);
    coordReadout.hidden = false;
  }

  function clearPin() {
    if (marker) { map.removeLayer(marker); marker = null; }
    latInput.value = '';
    lngInput.value = '';
    coordReadout.hidden = true;
  }

  // Click to drop pin
  map.on('click', (e) => placePin(e.latlng.lat, e.latlng.lng));

  // Clear pin button
  clearPinBtn.addEventListener('click', clearPin);

  // "Use my location" button
  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showValidation('Geolocation is not supported by your browser.');
      return;
    }
    geoBtn.disabled = true;
    geoBtn.textContent = '📍 Locating…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placePin(pos.coords.latitude, pos.coords.longitude);
        map.setView([pos.coords.latitude, pos.coords.longitude], 16);
        geoBtn.disabled = false;
        geoBtn.textContent = '📍 Use my location';
      },
      (err) => {
        showValidation('Could not get your location: ' + err.message);
        geoBtn.disabled = false;
        geoBtn.textContent = '📍 Use my location';
      },
      { timeout: 10000 }
    );
  });

  /* ── Image upload preview ──────────────────────────────────────── */
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;

    // 5 MB guard
    if (file.size > 5 * 1024 * 1024) {
      showValidation('Image must be under 5 MB.');
      imageInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.hidden = false;
      uploadPrompt.hidden = true;
      removeImageBtn.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  removeImageBtn.addEventListener('click', () => {
    imageInput.value = '';
    imagePreview.src = '';
    imagePreview.hidden = true;
    uploadPrompt.hidden = false;
    removeImageBtn.hidden = true;
  });

  /* ── Validation helpers ────────────────────────────────────────── */
  function showValidation(msg) {
    validationMsg.textContent = msg;
    validationBanner.hidden = false;
    validationBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearValidation() {
    validationBanner.hidden = true;
    validationMsg.textContent = '';
  }

  /* ── Loading state ─────────────────────────────────────────────── */
  function setLoading(on) {
    submitBtn.disabled = on;
    submitLabel.textContent = on ? 'Submitting…' : 'Submit Report';
    submitSpinner.hidden = !on;
  }

  /* ── Form submit ───────────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearValidation();

    // Client-side validation
    if (!descEl.value.trim()) {
      showValidation('Please describe the issue before submitting.');
      descEl.focus();
      return;
    }
    if (descEl.value.trim().length < 10) {
      showValidation('Description is too short. Please provide more detail.');
      descEl.focus();
      return;
    }

    const fd = new FormData(form);

    // Remove empty hidden coords so the API doesn't receive empty strings
    if (!latInput.value) { fd.delete('latitude');  }
    if (!lngInput.value) { fd.delete('longitude'); }

    setLoading(true);

    try {
      const res = await fetch('/api/reports', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        showValidation(data.error || `Server error (${res.status}).`);
        setLoading(false);
        return;
      }

      // Success — show result card
      setLoading(false);
      form.hidden = true;
      showResultCard(data);

    } catch (err) {
      showValidation('Network error — please check your connection and try again.');
      setLoading(false);
    }
  });

  /* ── Result card ───────────────────────────────────────────────── */
  function showResultCard(data) {
    // Tracking ID
    resultTrackingId.textContent = data.tracking_id;
    trackLink.href = `/track/${data.tracking_id}`;

    // Duplicate warning
    if (data.duplicate_of) {
      duplicateMsg.textContent = data.duplicate_message;
      duplicateWarning.hidden = false;
    } else {
      duplicateWarning.hidden = true;
    }

    // Category, summary
    resultCategory.textContent = data.category || '—';
    resultSummary.textContent  = data.summary  || '—';

    // Priority badge
    const level = data.priority_level || 'Low';
    resultPriorityBadge.textContent = level;
    resultPriorityBadge.className = `priority-badge badge-${level}`;

    // Priority factors
    factorsList.innerHTML = '';
    const factors = data.priority_factors || [];
    if (factors.length === 0) {
      const li = document.createElement('li');
      li.className = 'factor-item';
      li.textContent = 'No factors recorded.';
      factorsList.appendChild(li);
    } else {
      factors.forEach(f => {
        const li = document.createElement('li');
        li.className = 'factor-item';
        li.innerHTML = `
          <span>${escHtml(f.factor)}</span>
          <span class="factor-pts">+${f.points}</span>
        `;
        factorsList.appendChild(li);
      });
    }

    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── Copy tracking ID ──────────────────────────────────────────── */
  copyBtn.addEventListener('click', () => {
    const id = resultTrackingId.textContent;
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1800);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = id;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1800);
    });
  });

  /* ── New report button ─────────────────────────────────────────── */
  newReportBtn.addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    resultCard.hidden = true;
    clearPin();
    clearValidation();
    // Reset image
    imagePreview.src = '';
    imagePreview.hidden = true;
    uploadPrompt.hidden = false;
    removeImageBtn.hidden = true;
    // Scroll to top of card
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ── Utility ───────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

}  // end initReportPage()

/* =====================================================================
   Track page – initTrackPage()
   ===================================================================== */
function initTrackPage() {

  /* ── Element refs ──────────────────────────────────────────────── */
  const trackInput      = document.getElementById('trackInput');
  const trackBtn        = document.getElementById('trackBtn');
  const searchError     = document.getElementById('searchError');
  const searchCard      = document.getElementById('searchCard');

  const reportDetail    = document.getElementById('reportDetail');
  const statusStrip     = document.getElementById('statusStrip');
  const detailTrackingId= document.getElementById('detailTrackingId');
  const detailTitle     = document.getElementById('detailTitle');
  const refreshBadge    = document.getElementById('refreshBadge');
  const refreshDot      = document.getElementById('refreshDot');
  const refreshLabel    = document.getElementById('refreshLabel');
  const stepperEl       = document.getElementById('stepper');

  const metaCategory    = document.getElementById('metaCategory');
  const metaPriority    = document.getElementById('metaPriority');
  const metaSummary     = document.getElementById('metaSummary');
  const metaAssigned    = document.getElementById('metaAssigned');
  const metaAddress     = document.getElementById('metaAddress');
  const metaCreated     = document.getElementById('metaCreated');
  const metaUpdated     = document.getElementById('metaUpdated');
  const factorsDetails  = document.getElementById('factorsDetails');
  const metaFactors     = document.getElementById('metaFactors');
  const dupNotice       = document.getElementById('dupNotice');
  const timelineEl      = document.getElementById('timeline');

  // Feature 1: Me Too widget elements
  const metooWidget     = document.getElementById('metooWidget');
  const metooInfo       = document.getElementById('metooInfo');
  const metooBtn        = document.getElementById('metooBtn');
  const metooCount      = document.getElementById('metooCount');
  const metooThanks     = document.getElementById('metooThanks');

  // Track which tracking_id Me Too was sent for (prevent double-tap)
  let metooSent = false;

  const searchAgainBtn  = document.getElementById('searchAgainBtn');
  const notFoundPanel   = document.getElementById('notFoundPanel');
  const notFoundMsg     = document.getElementById('notFoundMsg');
  const notFoundBackBtn = document.getElementById('notFoundBackBtn');

  /* ── Status pipeline (order matters for stepper) ──────────────── */
  const STEPS = [
    { key: 'Submitted',    icon: '📩', label: 'Submitted' },
    { key: 'Under Review', icon: '🔍', label: 'Under\nReview' },
    { key: 'Assigned',     icon: '👷', label: 'Assigned' },
    { key: 'In Progress',  icon: '🔧', label: 'In\nProgress' },
    { key: 'Resolved—Awaiting Verification', icon: '⏳', label: 'Awaiting\nVerify' },
    { key: 'Closed',       icon: '✅', label: 'Closed' },
  ];
  // Terminal states not in stepper (show as completed)
  const TERMINAL = ['Rejected', 'Duplicate'];
  const STEP_ORDER = STEPS.map(s => s.key);

  /* ── Auto-refresh ──────────────────────────────────────────────── */
  let currentId    = null;
  let refreshTimer = null;
  const REFRESH_MS = 10_000;

  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (currentId) fetchReport(currentId, /* silent */ true);
    }, REFRESH_MS);
  }

  /* ── Search trigger ────────────────────────────────────────────── */
  trackBtn.addEventListener('click', doSearch);
  trackInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // If URL contains a tracking_id path segment (/track/CIV-1007), pre-load it
  const pathMatch = window.location.pathname.match(/\/track\/([A-Z]+-\d+)/i);
  if (pathMatch) {
    const tid = pathMatch[1].toUpperCase();
    trackInput.value = tid;
    fetchReport(tid);
  }

  function doSearch() {
    const raw = trackInput.value.trim().toUpperCase();
    if (!raw) {
      showSearchError('Please enter a tracking ID, e.g. CIV-1007.');
      return;
    }
    // Normalise: accept "1007" → "CIV-1007"
    const id = /^[A-Z]+-\d+$/.test(raw) ? raw : `CIV-${raw.replace(/\D/g, '')}`;
    fetchReport(id);
  }

  /* ── Fetch & render ────────────────────────────────────────────── */
  async function fetchReport(trackingId, silent = false) {
    if (!silent) {
      setLoading(true);
      clearSearchError();
    }
    pulseRefreshDot();

    try {
      const res  = await fetch(`/api/reports/${encodeURIComponent(trackingId)}`);
      const data = await res.json();

      if (res.status === 404) {
        currentId = null;
        clearTimeout(refreshTimer);
        if (!silent) showNotFound(trackingId, data.error);
        else markStale();
        return;
      }
      if (!res.ok) {
        if (!silent) showSearchError(data.error || `Server error (${res.status}).`);
        else markStale();
        return;
      }

      currentId = trackingId;
      render(data);
      scheduleRefresh();
      markLive();
      if (!silent) setLoading(false);

    } catch (err) {
      if (!silent) {
        showSearchError('Network error — check your connection.');
        setLoading(false);
      } else {
        markStale();
      }
    }
  }

  /* ── Verification widget ─────────────────────────────────────── */
  const verifySection = document.getElementById('verifySection');
  const verifyYesBtn  = document.getElementById('verifyYesBtn');
  const verifyNoBtn   = document.getElementById('verifyNoBtn');
  const verifyNote    = document.getElementById('verifyNote');
  const verifyDone    = document.getElementById('verifyDone');

  if (verifyYesBtn) {
    verifyYesBtn.addEventListener('click', () => doVerify(true));
    verifyNoBtn.addEventListener('click',  () => doVerify(false));
  }

  async function doVerify(confirmed) {
    if (!currentId) return;
    verifyYesBtn.disabled = true;
    verifyNoBtn.disabled  = true;
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(currentId)}/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ confirmed, note: verifyNote ? verifyNote.value.trim() : '' }),
      });
      if (res.ok) {
        verifyDone.hidden = false;
        verifySection.hidden = true;
        // Refresh the report to show updated status
        await fetchReport(currentId, false);
      } else {
        verifyYesBtn.disabled = false;
        verifyNoBtn.disabled  = false;
      }
    } catch {
      verifyYesBtn.disabled = false;
      verifyNoBtn.disabled  = false;
    }
  }

  /* ── Render full report ────────────────────────────────────────── */
  function render(r) {
    // Show/hide panels
    notFoundPanel.hidden = true;
    reportDetail.hidden  = false;
    searchCard.hidden    = false;         // keep search visible for re-search

    /* ── Status strip ── */
    const statusKey = (r.status || 'Submitted').replace(/\s+/g, '');
    statusStrip.className = `status-strip strip-${statusKey}`;
    statusStrip.textContent = r.status || '';

    /* ── Header ── */
    detailTrackingId.textContent = r.tracking_id || '';
    detailTitle.textContent      = r.title        || '';

    /* ── Stepper ── */
    renderStepper(r.status);

    /* ── Meta grid ── */
    metaCategory.textContent = r.category || '—';
    metaSummary.textContent  = r.summary  || '—';
    metaAssigned.textContent = r.assigned_to || 'Not yet assigned';
    metaAddress.textContent  = r.address  || '—';
    metaCreated.textContent  = fmtDate(r.created_at);
    metaUpdated.textContent  = fmtDate(r.updated_at);

    const level = r.priority_level || 'Low';
    metaPriority.textContent  = level;
    metaPriority.className    = `priority-badge badge-${level}`;

    /* ── Priority factors ── */
    let factors = r.priority_reason;
    if (typeof factors === 'string') {
      try { factors = JSON.parse(factors); } catch { factors = null; }
    }
    if (Array.isArray(factors) && factors.length) {
      metaFactors.innerHTML = '';
      factors.forEach(f => {
        const li = document.createElement('li');
        li.className = 'factor-item';
        li.innerHTML = `<span>${escHtml(f.factor)}</span><span class="factor-pts">+${f.points}</span>`;
        metaFactors.appendChild(li);
      });
      factorsDetails.hidden = false;
    } else {
      factorsDetails.hidden = true;
    }

    /* ── Duplicate notice ── */
    if (r.duplicate_of_tracking_id) {
      dupNotice.textContent = `This report is linked as a duplicate of ${r.duplicate_of_tracking_id}.`;
      dupNotice.hidden = false;
    } else {
      dupNotice.hidden = true;
    }

    /* ── Me Too widget (Feature 1) ── */
    // Show for: (a) duplicates — citizen can upvote the primary issue
    //           (b) primary reports that already have upvotes — shows community interest
    const hasDup       = !!r.duplicate_of_tracking_id;
    const mCount       = r.metoo_count || 0;
    const showMetoo    = hasDup || mCount > 0;
    metooSent = false;
    metooThanks.hidden = true;
    metooBtn.disabled  = false;

    if (showMetoo) {
      metooCount.textContent = mCount;
      if (hasDup) {
        metooInfo.innerHTML = `<strong>${mCount} ${mCount === 1 ? 'person' : 'people'}</strong>
          also reported this issue (linked to <strong>${escHtml(r.duplicate_of_tracking_id)}</strong>).
          Tap <em>Me Too</em> if you're affected too.`;
      } else {
        metooInfo.innerHTML = `<strong>${mCount} ${mCount === 1 ? 'person' : 'people'}</strong>
          confirmed this issue. Tap <em>Me Too</em> if you're affected too.`;
      }
      metooWidget.hidden = false;
    } else {
      metooWidget.hidden = true;
    }

    /* ── Resident verification widget ── */
    if (verifySection) {
      verifySection.hidden = (r.status !== 'Resolved—Awaiting Verification');
      verifyDone.hidden = true;
      if (verifyYesBtn) { verifyYesBtn.disabled = false; verifyNoBtn.disabled = false; }
    }

    /* ── Timeline ── */
    renderTimeline(r.status_history || []);
  }

  /* ── Stepper renderer ──────────────────────────────────────────── */
  function renderStepper(currentStatus) {
    const activeIdx = STEP_ORDER.indexOf(currentStatus);
    stepperEl.innerHTML = '';

    STEPS.forEach((s, i) => {
      const isDone   = i < activeIdx;
      const isActive = i === activeIdx;

      const li = document.createElement('li');
      li.className = `step${isDone ? ' done' : ''}${isActive ? ' active' : ''}`;
      li.setAttribute('aria-current', isActive ? 'step' : 'false');

      const circle = document.createElement('div');
      circle.className = 'step-circle';
      circle.textContent = isDone ? '✓' : s.icon;

      const label = document.createElement('span');
      label.className = 'step-label';
      label.textContent = s.label;

      li.appendChild(circle);
      li.appendChild(label);
      stepperEl.appendChild(li);
    });
  }

  /* ── Timeline renderer ─────────────────────────────────────────── */
  function renderTimeline(history) {
    timelineEl.innerHTML = '';
    if (!history.length) {
      const li = document.createElement('li');
      li.className = 'timeline-item';
      li.innerHTML = '<span class="tl-status">No history yet.</span>';
      timelineEl.appendChild(li);
      return;
    }

    // Newest first for the timeline
    const sorted = [...history].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    sorted.forEach((h, idx) => {
      const li = document.createElement('li');
      const isLatest   = idx === 0;
      const isResolved = h.status === 'Resolved';
      li.className = `timeline-item${isLatest ? ' tl-latest' : ''}${isResolved ? ' tl-resolved' : ''}`;

      li.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="tl-status">${escHtml(h.status)}</div>
        ${h.note ? `<div class="tl-note">${escHtml(h.note)}</div>` : ''}
        <div class="tl-time">${fmtDate(h.timestamp)}</div>
      `;
      timelineEl.appendChild(li);
    });
  }

  /* ── Not-found display ─────────────────────────────────────────── */
  function showNotFound(id, msg) {
    setLoading(false);
    reportDetail.hidden  = true;
    notFoundPanel.hidden = false;
    notFoundMsg.textContent = msg || `No report found with tracking ID "${id}".`;
  }

  /* ── Refresh badge states ──────────────────────────────────────── */
  function markLive() {
    refreshBadge.classList.remove('stale');
    refreshLabel.textContent = 'Live';
    refreshDot.style.background = '';
  }
  function markStale() {
    refreshBadge.classList.add('stale');
    refreshLabel.textContent = 'Offline';
  }
  function pulseRefreshDot() {
    refreshDot.classList.remove('pulsing');
    void refreshDot.offsetWidth;  // reflow to restart animation
    refreshDot.classList.add('pulsing');
    refreshDot.addEventListener('animationend', () =>
      refreshDot.classList.remove('pulsing'), { once: true }
    );
  }

  /* ── Search-again / back buttons ───────────────────────────────── */
  function resetToSearch() {
    clearTimeout(refreshTimer);
    currentId = null;
    reportDetail.hidden  = true;
    notFoundPanel.hidden = true;
    searchCard.hidden    = false;
    clearSearchError();
    trackInput.value = '';
    trackInput.focus();
  }

  searchAgainBtn.addEventListener('click', resetToSearch);
  notFoundBackBtn.addEventListener('click', resetToSearch);

  /* ── Me Too button handler (Feature 1) ────────────────────────── */
  metooBtn.addEventListener('click', async () => {
    if (metooSent || !currentId) return;   // prevent double-click
    metooSent = true;
    metooBtn.disabled = true;

    try {
      const res  = await fetch(`/api/reports/${encodeURIComponent(currentId)}/metoo`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        // Update counter in-place without a full refresh
        metooCount.textContent = data.metoo_count;
        metooThanks.hidden = false;
      } else {
        // Non-fatal: just re-enable the button
        metooSent = false;
        metooBtn.disabled = false;
      }
    } catch {
      // Network error: allow retry
      metooSent = false;
      metooBtn.disabled = false;
    }
  });

  /* ── Helpers ───────────────────────────────────────────────────── */
  function setLoading(on) {
    trackBtn.disabled   = on;
    trackBtn.textContent = on ? 'Searching…' : 'Search';
  }
  function showSearchError(msg) {
    searchError.textContent = msg;
    searchError.hidden = false;
  }
  function clearSearchError() {
    searchError.hidden = true;
    searchError.textContent = '';
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium', timeStyle: 'short'
      });
    } catch { return iso; }
  }
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

}  // end initTrackPage()

/* =====================================================================
   Admin Dashboard – initAdminPage()
   ===================================================================== */

function initAdminPage() {

  /* ── Constants ─────────────────────────────────────────────────── */
  const PRIORITY_COLORS = {
    Critical: '#dc2626',
    High:     '#f97316',
    Medium:   '#f59e0b',
    Low:      '#3b82f6',
  };
  const STATUS_ORDER = ['Submitted','Under Review','Assigned','In Progress','Resolved'];
  const CATEGORIES   = ['Waterlogging','Road Damage','Garbage','Streetlight','Drainage','Water Supply'];
  const PRIORITIES   = ['Critical','High','Medium','Low'];

  /* ── State ─────────────────────────────────────────────────────── */
  let allReports     = [];
  let selectedId     = null;  // numeric report id currently in action panel
  let catChart       = null;  // Chart.js instance
  let markerLayer    = null;  // Leaflet layer group for report markers
  let hotspotLayer   = null;  // Leaflet layer group for hotspot circles

  /* ── Leaflet map ───────────────────────────────────────────────── */
  const adminMap = L.map('adminMap').setView([28.620, 77.210], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(adminMap);

  markerLayer  = L.layerGroup().addTo(adminMap);
  hotspotLayer = L.layerGroup().addTo(adminMap);

  // Build map legend
  const mapLegend = document.getElementById('mapLegend');
  Object.entries(PRIORITY_COLORS).forEach(([level, color]) => {
    const span = document.createElement('span');
    span.innerHTML = `<span class="legend-dot" style="background:${color}"></span>${level}`;
    mapLegend.appendChild(span);
  });

  /* ── Filter selects ────────────────────────────────────────────── */
  const filterStatus   = document.getElementById('filterStatus');
  const filterCategory = document.getElementById('filterCategory');
  const filterPriority = document.getElementById('filterPriority');
  const clearFilters   = document.getElementById('clearFilters');

  // Filter selects already have options in HTML; just bind listeners
  filterStatus.addEventListener('change',   applyFilters);
  filterCategory.addEventListener('change', applyFilters);
  filterPriority.addEventListener('change', applyFilters);
  clearFilters.addEventListener('click', () => {
    filterStatus.value = '';
    filterCategory.value = '';
    filterPriority.value = '';
    applyFilters();
  });

  /* ── Action panel ──────────────────────────────────────────────── */
  const actionPanel    = document.getElementById('actionPanel');
  const actionTrackId  = document.getElementById('actionTrackingId');
  const actionTitleEl  = document.getElementById('actionTitle');
  const actionStatus   = document.getElementById('actionStatus');
  const actionAssigned = document.getElementById('actionAssigned');
  const actionDupOf    = document.getElementById('actionDupOf');
  const actionNote     = document.getElementById('actionNote');
  const submitAction   = document.getElementById('submitAction');
  const actionMsg      = document.getElementById('actionMsg');
  const closeAction    = document.getElementById('closeAction');
  const dupLinkField   = document.getElementById('dupLinkField');

  // Show/hide duplicate-of field depending on chosen status
  actionStatus.addEventListener('change', () => {
    if (dupLinkField) dupLinkField.style.display = actionStatus.value === 'Duplicate' ? '' : 'none';
  });
  if (dupLinkField) dupLinkField.style.display = 'none'; // hidden by default

  closeAction.addEventListener('click', () => {
    actionPanel.hidden = true;
    selectedId = null;
  });

  submitAction.addEventListener('click', doStatusUpdate);

  /* ── Boot: load all data ───────────────────────────────────────── */
  Promise.all([loadStats(), loadReports(), loadHotspots(), loadBrief()]);

  /* ── Load stats ────────────────────────────────────────────────── */
  async function loadStats() {
    try {
      const data = await apiFetch('/api/stats');
      renderStats(data);
      renderChart(data.by_category);
    } catch (e) { console.error('stats error', e); }
  }

  function renderStats(data) {
    const statCards = document.getElementById('statCards');
    const cards = [
      { label: 'Total',    value: data.total,    cls: '' },
      { label: 'Open',     value: data.open,     cls: 'stat-open' },
      { label: 'Resolved', value: data.resolved, cls: 'stat-resolved' },
      {
        label: 'Critical',
        value: (data.by_priority && data.by_priority['Critical']) || 0,
        cls: 'stat-critical',
        tooltip: 'Reports with Critical priority level',
      },
    ];

    // add per-status counts
    if (data.by_status) {
      Object.entries(data.by_status).forEach(([s, n]) => {
        cards.push({ label: s, value: n, cls: '' });
      });
    }

    statCards.innerHTML = '';
    cards.forEach(c => {
      const div = document.createElement('div');
      div.className = `stat-card ${c.cls}`;
      div.title = c.tooltip || '';
      div.innerHTML = `<div class="stat-value">${c.value}</div>
                       <div class="stat-label">${escHtml(c.label)}</div>`;
      statCards.appendChild(div);
    });
  }

  /* ── Category bar chart ────────────────────────────────────────── */
  function renderChart(byCat) {
    const labels = Object.keys(byCat);
    const values = Object.values(byCat);
    const CHART_COLORS = ['#0d9488','#0f2d4a','#6366f1','#f59e0b','#f97316','#dc2626'];

    const ctx = document.getElementById('catChart').getContext('2d');
    if (catChart) catChart.destroy();
    catChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Reports',
          data: values,
          backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { ticks: { precision: 0 }, beginAtZero: true },
        },
      },
    });
  }

  /* ── Load & render reports ─────────────────────────────────────── */
  async function loadReports() {
    try {
      const data = await apiFetch('/api/reports?limit=200');
      allReports = data.reports || [];
      applyFilters();
      renderMarkers(allReports);
    } catch (e) {
      document.getElementById('tableBody').innerHTML =
        `<tr><td colspan="9" class="tbl-loading">Failed to load reports.</td></tr>`;
    }
  }

  function applyFilters() {
    const st = filterStatus.value;
    const ca = filterCategory.value;
    const pr = filterPriority.value;
    const filtered = allReports.filter(r =>
      (!st || r.status      === st) &&
      (!ca || r.category    === ca) &&
      (!pr || r.priority_level === pr)
    );
    renderTable(filtered);
  }

  /* ── Table ─────────────────────────────────────────────────────── */
  function renderTable(reports) {
    const tbody = document.getElementById('tableBody');
    if (!reports.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="tbl-loading">No reports match the current filters.</td></tr>`;
      return;
    }

    // Sort by priority_score DESC
    const sorted = [...reports].sort((a, b) => b.priority_score - a.priority_score);
    tbody.innerHTML = '';

    sorted.forEach(r => {
      const factors = parseFactors(r.priority_reason);

      /* Main row */
      const tr = document.createElement('tr');
      tr.dataset.id = r.id;
      tr.innerHTML = `
        <td>
          <a href="/track/${escHtml(r.tracking_id)}" target="_blank">${escHtml(r.tracking_id)}</a>
          ${r.duplicate_of ? `<span class="dup-badge">DUP</span>` : ''}
        </td>
        <td>
          ${escHtml((r.title || '').slice(0, 55))}${r.title && r.title.length > 55 ? '…' : ''}
          ${factors.length
            ? `<br><button class="factors-toggle" data-id="${r.id}">▸ Why this priority?</button>`
            : ''}
        </td>
        <td>${escHtml(r.category || '—')}</td>
        <td><span class="priority-badge badge-${r.priority_level}">${r.priority_level}</span>
            <span style="font-size:.75rem;color:var(--muted);margin-left:.3rem;">${r.priority_score}</span></td>
        <td>${escHtml(r.status)}</td>
        <td>${escHtml(r.assigned_to || '—')}</td>
        <td style="white-space:nowrap">${(r.created_at || '').slice(0, 10)}</td>
        <td style="text-align:center">
          <!-- Me Too upvotes + AI duplicate count (Feature 1) -->
          <span title="Me Too upvotes">${r.metoo_count || 0}</span>
          ${(r.duplicate_count || 0) > 0
            ? `<span class="dup-badge" title="AI-detected duplicates">+${r.duplicate_count} dup</span>`
            : ''}
        </td>
        <td>
          <button class="btn btn-outline btn-update" data-id="${r.id}">Update</button>
        </td>
      `;

      /* Expandable factors row */
      const trF = document.createElement('tr');
      trF.className = 'row-factors';
      trF.dataset.factorsFor = r.id;
      trF.innerHTML = `<td colspan="9">${renderFactorsHtml(factors)}</td>`;

      tbody.appendChild(tr);
      tbody.appendChild(trF);
    });

    // Attach toggle listeners
    tbody.querySelectorAll('.factors-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const fRow = tbody.querySelector(`[data-factors-for="${id}"]`);
        const open = fRow.classList.toggle('open');
        btn.textContent = open ? '▾ Hide factors' : '▸ Why this priority?';
      });
    });

    // Update button listeners
    tbody.querySelectorAll('.btn-update').forEach(btn => {
      btn.addEventListener('click', () => openActionPanel(Number(btn.dataset.id)));
    });
  }

  function renderFactorsHtml(factors) {
    if (!factors.length) return '<em>No factors.</em>';
    return `<ul class="factors-list factors-compact">
      ${factors.map(f =>
        `<li class="factor-item"><span>${escHtml(f.factor)}</span><span class="factor-pts">+${f.points}</span></li>`
      ).join('')}
    </ul>`;
  }

  function parseFactors(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
  }

  /* ── Map markers ───────────────────────────────────────────────── */
  function renderMarkers(reports) {
    markerLayer.clearLayers();
    reports.forEach(r => {
      if (r.latitude == null || r.longitude == null) return;
      const color = PRIORITY_COLORS[r.priority_level] || '#64748b';
      const marker = L.circleMarker([r.latitude, r.longitude], {
        radius: 7,
        fillColor: color,
        color: '#fff',
        weight: 1.5,
        fillOpacity: 0.85,
      });
      marker.bindPopup(
        `<strong>${escHtml(r.tracking_id)}</strong><br>
         ${escHtml((r.title || '').slice(0, 60))}<br>
         <span style="color:${color};font-weight:700">${r.priority_level}</span>
         · ${escHtml(r.status)}`
      );
      marker.addTo(markerLayer);
    });
  }

  /* ── Hotspot circles ───────────────────────────────────────────── */
  async function loadHotspots() {
    try {
      const data = await apiFetch('/api/hotspots');
      hotspotLayer.clearLayers();
      (data.clusters || []).forEach(c => {
        const circle = L.circle([c.centre_lat, c.centre_lon], {
          radius: 160,
          color: '#f59e0b',
          fillColor: '#fef3c7',
          fillOpacity: 0.35,
          weight: 2,
          dashArray: '5,5',
        });
        circle.bindTooltip(
          `<strong>${escHtml(c.cluster_id)}</strong><br>${c.count} reports<br>${escHtml(c.description)}`,
          { sticky: true, maxWidth: 260 }
        );
        circle.addTo(hotspotLayer);
      });
    } catch (e) { console.error('hotspots error', e); }
  }

  /* ── Action brief ──────────────────────────────────────────────── */
  async function loadBrief() {
    const briefContent = document.getElementById('briefContent');
    try {
      const data = await apiFetch('/api/brief?top_n=3');
      const items = [
        ...(data.report_briefs  || []).map(b => ({ header: `${b.tracking_id} · ${b.priority_level}`, body: b.brief, badge: b.priority_level })),
        ...(data.hotspot_briefs || []).map(b => ({ header: `${b.cluster_id} · ${b.count} reports`,  body: b.brief, badge: 'Cluster' })),
      ];
      if (!items.length) {
        briefContent.innerHTML = '<p class="brief-loading">No active priorities.</p>';
        return;
      }
      briefContent.innerHTML = items.map(item => `
        <div class="brief-item">
          <div class="brief-item-header">
            <span>${escHtml(item.header)}</span>
            <span class="priority-badge badge-${item.badge}">${escHtml(item.badge)}</span>
          </div>
          <div class="brief-item-body">${escHtml(item.body)}</div>
        </div>
      `).join('');
    } catch (e) {
      briefContent.innerHTML = '<p class="brief-loading">Failed to load briefs.</p>';
    }
  }

  /* ── Action panel open ─────────────────────────────────────────── */
  function openActionPanel(id) {
    const r = allReports.find(x => x.id === id);
    if (!r) return;
    selectedId = id;

    actionTrackId.textContent  = r.tracking_id;
    actionTitleEl.textContent  = r.title;
    actionStatus.value         = r.status;
    actionAssigned.value       = r.assigned_to || '';
    if (actionDupOf) actionDupOf.value = r.duplicate_of_tracking_id || '';
    actionNote.value           = '';
    if (dupLinkField) dupLinkField.style.display = r.status === 'Duplicate' ? '' : 'none';

    hideActionMsg();
    actionPanel.hidden = false;
    actionPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── Status update ─────────────────────────────────────────────── */
  async function doStatusUpdate() {
    if (!selectedId) return;
    const note = actionNote.value.trim();
    if (!note) {
      showActionMsg('A note is required for every status change.', 'error');
      return;
    }
    const body = {
      status:      actionStatus.value,
      assigned_to: actionAssigned.value.trim() || null,
      note,
      duplicate_of_tracking_id: (actionDupOf && actionDupOf.value.trim()) || null,
    };
    submitAction.disabled = true;
    submitAction.textContent = 'Saving…';
    hideActionMsg();

    try {
      const res  = await fetch(`/api/reports/${selectedId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showActionMsg(data.error || 'Update failed.', 'error');
      } else {
        showActionMsg('Status updated successfully.', 'success');
        // Refresh everything
        await Promise.all([loadStats(), loadReports(), loadHotspots(), loadBrief()]);
      }
    } catch (e) {
      showActionMsg('Network error.', 'error');
    } finally {
      submitAction.disabled = false;
      submitAction.textContent = '💾 Save Changes';
    }
  }

  function showActionMsg(msg, type) {
    actionMsg.textContent = msg;
    actionMsg.className   = `action-msg ${type}`;
    actionMsg.hidden      = false;
    setTimeout(() => { actionMsg.hidden = true; }, 4000);
  }
  function hideActionMsg() {
    actionMsg.hidden = true;
  }

  /* ── Utility ───────────────────────────────────────────────────── */
  async function apiFetch(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

}  // end initAdminPage()

/* =====================================================================
   Explore Page – initExplorePage()
   ===================================================================== */
function initExplorePage() {

  const searchQ    = document.getElementById('exploreQ');
  const searchBtn  = document.getElementById('exploreSearchBtn');
  const statusSel  = document.getElementById('exploreStatus');
  const catSel     = document.getElementById('exploreCategory');
  const priSel     = document.getElementById('explorePriority');
  const dateFrom   = document.getElementById('exploreDateFrom');
  const dateTo     = document.getElementById('exploreDateTo');
  const clearBtn   = document.getElementById('exploreClear');
  const countEl    = document.getElementById('exploreCount');
  const cardsEl    = document.getElementById('exploreCards');
  const loadMoreBtn= document.getElementById('loadMoreBtn');
  const loadMoreWrap=document.getElementById('exploreLoadMore');
  const listView   = document.getElementById('exploreListView');
  const mapView    = document.getElementById('exploreMapView');
  const viewListBtn= document.getElementById('viewListBtn');
  const viewMapBtn = document.getElementById('viewMapBtn');

  let offset       = 0;
  const LIMIT      = 20;
  let total        = 0;
  let currentMap   = null;
  let markerLayer  = null;

  /* ── Search / filter events ── */
  searchBtn.addEventListener('click',  () => { offset = 0; cardsEl.innerHTML = ''; load(); });
  clearBtn.addEventListener('click',   clearAll);
  statusSel.addEventListener('change', () => { offset = 0; cardsEl.innerHTML = ''; load(); });
  catSel.addEventListener('change',    () => { offset = 0; cardsEl.innerHTML = ''; load(); });
  priSel.addEventListener('change',    () => { offset = 0; cardsEl.innerHTML = ''; load(); });
  dateFrom.addEventListener('change',  () => { offset = 0; cardsEl.innerHTML = ''; load(); });
  dateTo.addEventListener('change',    () => { offset = 0; cardsEl.innerHTML = ''; load(); });
  searchQ.addEventListener('keydown',  e => { if (e.key === 'Enter') { offset = 0; cardsEl.innerHTML = ''; load(); } });
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => load(true));

  /* ── View toggle ── */
  viewListBtn.addEventListener('click', () => {
    listView.hidden = false; mapView.hidden = true;
    viewListBtn.className = 'btn btn-sm btn-primary view-btn';
    viewMapBtn.className  = 'btn btn-sm btn-outline view-btn';
  });
  viewMapBtn.addEventListener('click', () => {
    listView.hidden = true; mapView.hidden = false;
    viewListBtn.className = 'btn btn-sm btn-outline view-btn';
    viewMapBtn.className  = 'btn btn-sm btn-primary view-btn';
    initExploreMap();
  });

  /* ── Initial load ── */
  load();

  /* ── Build API URL from filters ── */
  function buildUrl(appendOffset) {
    const params = new URLSearchParams();
    if (searchQ.value.trim())   params.set('q',         searchQ.value.trim());
    if (statusSel.value)        params.set('status',    statusSel.value);
    if (catSel.value)           params.set('category',  catSel.value);
    if (priSel.value)           params.set('priority',  priSel.value);
    if (dateFrom.value)         params.set('date_from', dateFrom.value);
    if (dateTo.value)           params.set('date_to',   dateTo.value);
    params.set('limit',  LIMIT);
    params.set('offset', appendOffset ? offset : 0);
    return `/api/reports/search?${params}`;
  }

  /* ── Load and render ── */
  async function load(append = false) {
    if (!append) {
      cardsEl.innerHTML = `<p class="explore-loading" data-i18n="explore.loading">Loading reports…</p>`;
    }
    try {
      const res  = await fetch(buildUrl(append));
      const data = await res.json();
      total = data.total || 0;
      const reports = data.reports || [];

      if (!append) cardsEl.innerHTML = '';

      if (!reports.length && !append) {
        cardsEl.innerHTML = `<p class="explore-empty" data-i18n="explore.none">No reports match your filters.</p>`;
        if (window.i18n) window.i18n.applyToDOM(cardsEl);
      } else {
        reports.forEach(r => cardsEl.appendChild(buildCard(r)));
      }

      offset += reports.length;
      countEl.textContent = `${total} report${total !== 1 ? 's' : ''} found`;
      if (loadMoreWrap) loadMoreWrap.hidden = (offset >= total);

      // Re-translate any new data-i18n elements
      if (window.i18n) window.i18n.applyToDOM(cardsEl);
      if (window.i18n) window.i18n.applyToDOM(countEl.parentElement);

    } catch (e) {
      cardsEl.innerHTML = `<p class="explore-empty" style="color:var(--danger)">Failed to load reports. Please try again.</p>`;
    }
  }

  /* ── Card builder ── */
  function buildCard(r) {
    const card = document.createElement('article');
    card.className = 'explore-card';
    card.setAttribute('role', 'listitem');

    const statusCls = statusClass(r.status);
    const priCls    = `badge-${r.priority_level}`;
    const demoTag   = r.is_demo ? `<span class="demo-badge" data-i18n="explore.demo.label">Demo</span>` : '';

    card.innerHTML = `
      <div class="explore-card-top">
        <span class="priority-badge ${priCls}">${escHtml(r.priority_level)}</span>
        <span class="explore-status ${statusCls}">${escHtml(r.status)}</span>
        ${demoTag}
      </div>
      <h3 class="explore-card-title">
        <a href="/track/${encodeURIComponent(r.tracking_id)}">${escHtml(r.title || r.tracking_id)}</a>
      </h3>
      <p  class="explore-card-summary">${escHtml((r.summary || r.tracking_id))}</p>
      <div class="explore-card-meta">
        <span>📁 ${escHtml(r.category || '—')}</span>
        ${r.address ? `<span>📍 ${escHtml(r.address)}</span>` : ''}
        <span>🗓 ${(r.created_at || '').slice(0, 10)}</span>
        ${(r.metoo_count || 0) > 0 ? `<span>👍 ${r.metoo_count}</span>` : ''}
      </div>
    `;
    return card;
  }

  function statusClass(s) {
    const map = {
      'Submitted':   'status-chip-submitted',
      'Under Review':'status-chip-review',
      'Assigned':    'status-chip-assigned',
      'In Progress': 'status-chip-progress',
      'Resolved':    'status-chip-resolved',
      'Resolved—Awaiting Verification': 'status-chip-awaiting',
      'Closed':      'status-chip-closed',
      'Rejected':    'status-chip-rejected',
      'Duplicate':   'status-chip-dup',
    };
    return map[s] || 'status-chip-submitted';
  }

  /* ── Clear all filters ── */
  function clearAll() {
    searchQ.value  = '';
    statusSel.value = '';
    catSel.value   = '';
    priSel.value   = '';
    dateFrom.value = '';
    dateTo.value   = '';
    offset = 0;
    cardsEl.innerHTML = '';
    load();
  }

  /* ── Explore map (lazy init) ── */
  function initExploreMap() {
    if (currentMap) return;  // already initialised
    currentMap  = L.map('exploreMap').setView([28.620, 77.210], 13);
    markerLayer = L.layerGroup().addTo(currentMap);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(currentMap);

    // Load all reports for the map (no pagination)
    fetch('/api/reports/search?limit=200').then(r => r.json()).then(data => {
      (data.reports || []).forEach(r => {
        if (r.latitude == null || r.longitude == null) return;
        const COLORS = { Critical:'#dc2626', High:'#f97316', Medium:'#f59e0b', Low:'#3b82f6' };
        const color = COLORS[r.priority_level] || '#64748b';
        L.circleMarker([r.latitude, r.longitude], {
          radius: 7, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.85,
        })
        .bindPopup(`<strong><a href="/track/${r.tracking_id}">${escHtml(r.tracking_id)}</a></strong><br>
                    ${escHtml((r.title || '').slice(0,60))}<br>
                    <span style="color:${color};font-weight:700">${r.priority_level}</span> · ${escHtml(r.status)}`)
        .addTo(markerLayer);
      });
    }).catch(() => {});
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

}  // end initExplorePage()
