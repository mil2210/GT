function getToken() {
    return localStorage.getItem("gt_token");
}

async function api(path, opts = {}) {
    const r = await fetch(path, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + getToken(),
            ...(opts.headers || {})
        }
    });

    if (r.status === 401) {
        localStorage.removeItem("gt_loggedin");
        localStorage.removeItem("gt_token");
        window.location.href = "login.html";
        return null;
    }

    return r;
}

// User-Check
const currentUser = localStorage.getItem("gt_loggedin");
if (!currentUser) {
    window.location.href = "login.html";
}

// Logout-Funktion (Token auch löschen!)
async function logout() {
    const confirmed = await confirmLogout();
    if (confirmed) {
        localStorage.removeItem("gt_loggedin");
        localStorage.removeItem("gt_token");
        window.location.href = "login.html";
    }
}

// ---- WICHTIG: Events kommen jetzt aus der DB ----
let events = [];

// Datum & Rendering
const state = { current: new Date() };

const todayLabel = document.getElementById('todayLabel');
const monthTitle = document.getElementById('monthTitle');
const monthSubtitle = document.getElementById('monthSubtitle');
const daysGrid = document.getElementById('daysGrid');
const countEvents = document.getElementById('countEvents');
const upcoming = document.getElementById('upcoming');

function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Statt localStorage: nur UI aktualisieren
function saveUI() {
    countEvents.textContent = events.length;
    renderUpcoming();
}

async function loadEventsFromDb() {
    const r = await api("/api/events");
    if (!r) return;
    events = await r.json();
    saveUI();
}

async function upsertEventToDb(ev) {
    const r = await api("/api/events", {
        method: "POST",
        body: JSON.stringify(ev)
    });
    if (!r) return false;
    if (!r.ok) {
        notifyError("Fehler beim Speichern in der Datenbank");
        return false;
    }
    return true;
}

async function deleteEventFromDb(id) {
    const r = await api("/api/events/" + encodeURIComponent(id), { method: "DELETE" });
    if (!r) return false;
    if (!r.ok) {
        notifyError("Fehler beim Löschen in der Datenbank");
        return false;
    }
    return true;
}

function renderUpcoming() {
    const now = new Date();
    const list = events
        .filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    if (list.length === 0) {
        upcoming.innerHTML = '— keine —';
        return;
    }

    upcoming.innerHTML = '';
    list.forEach(it => {
        const el = document.createElement('div');
        el.style.padding = '6px 8px';
        el.style.background = 'rgba(210,187,164,0.1)';
        el.style.borderRadius = '8px';
        el.style.marginBottom = '4px';

        const date = new Date(it.date);
        const daysDiff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        const timeInfo = daysDiff === 0
            ? 'Heute'
            : daysDiff === 1
                ? 'Morgen'
                : `in ${daysDiff} Tagen`;

        el.innerHTML = `
      <strong>${escapeHtml(it.title || '(kein Titel)')}</strong><br>
      <small>${it.date} ${it.time ? '• ' + escapeHtml(it.time) : ''}</small><br>
      <small style="color:var(--accent)">${timeInfo}</small>
    `;
        upcoming.appendChild(el);
    });
}

function render() {
    const cur = state.current;
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    monthTitle.textContent = first.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
    monthSubtitle.textContent = `${first.toLocaleString('de-DE', { weekday: 'long' })} – ${last.getDate()} Tage`;
    todayLabel.textContent = new Date().toLocaleDateString('de-DE');

    const startDay = (first.getDay() + 6) % 7;
    const total = startDay + last.getDate();
    const rows = Math.ceil(total / 7) * 7;

    daysGrid.innerHTML = '';
    for (let i = 0; i < rows; i++) {
        const dayIndex = i - startDay + 1;
        const d = new Date(year, month, dayIndex);
        const cell = document.createElement('button');
        cell.className = 'day';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', d.toLocaleDateString('de-DE'));

        if (dayIndex < 1 || dayIndex > last.getDate()) cell.classList.add('other-month');

        const num = document.createElement('div');
        num.className = 'day-number';
        num.textContent = d.getDate();
        cell.appendChild(num);

        const evWrap = document.createElement('div');
        evWrap.className = 'events';

        const dateKey = formatDate(d);
        const dayEvents = events.filter(ev => ev.date === dateKey).slice(0, 3);

        dayEvents.forEach(ev => {
            const e = document.createElement('div');
            e.className = 'event';
            e.innerHTML = `
        <div style="display:flex;align-items:center">
          <span class="dot"></span>
          <strong style="font-size:13px">${escapeHtml(ev.title || 'Termin')}</strong>
        </div>
        <small class="muted">${escapeHtml(ev.time || '')}</small>
      `;
            e.title = ev.note || '';
            e.addEventListener('click', (evt) => {
                evt.stopPropagation();
                openModal(dateKey, ev.id);
            });
            evWrap.appendChild(e);
        });

        if (dateKey === formatDate(new Date())) cell.classList.add('today');

        cell.appendChild(evWrap);
        cell.addEventListener('click', () => openModal(dateKey));
        daysGrid.appendChild(cell);
    }
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function openModal(date, eventId) {
    const existing = events.find(e => e.id === eventId && e.date === date) || null;
    const root = document.getElementById('modalRoot');
    root.style.display = 'block';
    root.innerHTML = `
  <div class="modal-backdrop" id="backdrop">
    <div class="modal" role="dialog" aria-modal="true">
      <h3 style="margin-top:0">Termin für ${date}</h3>
      <div class="form-row">
        <input id="title" placeholder="Titel (z.B. Vorsorge)" value="${existing ? escapeHtml(existing.title) : ''}" required>
      </div>
      <div class="form-row">
        <input id="time" type="time" placeholder="Zeit" value="${existing ? escapeHtml(existing.time) : ''}">
      </div>
      <div class="form-row">
        <select id="tag">
          <option value="">Kategorie</option>
          <option value="untersuchung" ${existing && existing.tag === 'untersuchung' ? 'selected' : ''}>Untersuchung</option>
          <option value="impfung" ${existing && existing.tag === 'impfung' ? 'selected' : ''}>Impfung</option>
          <option value="beratung" ${existing && existing.tag === 'beratung' ? 'selected' : ''}>Beratung</option>
        </select>
      </div>
      <div class="form-row">
        <textarea id="note" placeholder="Notiz">${existing ? escapeHtml(existing.note) : ''}</textarea>
      </div>
      <div class="modal-footer">
        <div class="controls">
          ${existing ? '<button id="deleteBtn" class="danger">Löschen</button>' : ''}
        </div>
        <div style="display:flex;gap:8px">
          <button id="closeBtn" class="btn">Abbrechen</button>
          <button id="saveBtn" class="btn">Speichern</button>
        </div>
      </div>
    </div>
  </div>`;

    document.getElementById('backdrop').addEventListener('click', (e) => {
        if (e.target.id === 'backdrop') closeModal();
    });

    document.getElementById('closeBtn').addEventListener('click', closeModal);

    // WICHTIG: async, damit wir DB speichern können
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const title = document.getElementById('title').value.trim();
        const time = document.getElementById('time').value.trim();
        const note = document.getElementById('note').value.trim();
        const tag = document.getElementById('tag').value;

        if (!title) {
            notifyWarning('Bitte einen Titel eingeben');
            return;
        }

        let ev;
        if (existing) {
            existing.title = title;
            existing.time = time;
            existing.note = note;
            existing.tag = tag;
            ev = existing;
        } else {
            ev = {
                id: uid(),
                date: date,
                title,
                time,
                note,
                tag
            };
            events.push(ev);
        }

        const ok = await upsertEventToDb(ev);
        if (!ok) return;

        // Optional: nochmal frisch aus DB laden (sicherste Variante)
        await loadEventsFromDb();

        render();
        closeModal();
    });

    if (existing) {
        document.getElementById('deleteBtn').addEventListener('click', async () => {
            const confirmed = await confirmDelete("Event");
            if (!confirmed) return;
            const ok = await deleteEventFromDb(existing.id);
            if (!ok) return;

            events = events.filter(e => e.id !== existing.id);
            saveUI();
            render();
            closeModal();
        });
    }
}


function closeModal() {
    const root = document.getElementById('modalRoot');
    root.style.display = 'none';
    root.innerHTML = '';
}

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Controls
document.getElementById('prevBtn').addEventListener('click', () => {
    state.current.setMonth(state.current.getMonth() - 1);
    render();
});

document.getElementById('nextBtn').addEventListener('click', () => {
    state.current.setMonth(state.current.getMonth() + 1);
    render();
});

document.getElementById('todayBtn').addEventListener('click', () => {
    state.current = new Date();
    render();
});

document.getElementById('addTodayBtn').addEventListener('click', () => {
    openModal(formatDate(new Date()));
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key === 'n') {
        state.current.setMonth(state.current.getMonth() + 1);
        render();
    }
    if (e.key === 'p') {
        state.current.setMonth(state.current.getMonth() - 1);
        render();
    }
    if (e.key === 't') {
        state.current = new Date();
        render();
    }
});

// Init: DB laden statt localStorage
window.addEventListener("DOMContentLoaded", async () => {
    await loadEventsFromDb();
    renderUpcoming();
    render();
});
