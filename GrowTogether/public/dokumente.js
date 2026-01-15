// --------- Auth + API ----------
document.addEventListener("DOMContentLoaded", () => {
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

// Logout muss GLOBAL sein, weil HTML onclick="logout()" nutzt
window.logout = function logout() {
  if (confirm("Möchtest du dich wirklich abmelden?")) {
    localStorage.removeItem("gt_loggedin");
    localStorage.removeItem("gt_token");
    window.location.href = "login.html";
  }
};

// Login-Check
const currentUser = localStorage.getItem("gt_loggedin");
if (!currentUser || !getToken()) {
  window.location.href = "login.html";
}

// --------- DOM ----------
const uploadArea = document.getElementById("uploadArea");
const selectBtn = document.getElementById("selectBtn");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const uploadBtn = document.getElementById("uploadBtn");
const uploadedList = document.getElementById("uploadedList");

// Modal (Preview UI ist vorhanden, aber ohne echte Datei-Daten können wir nur "Info" zeigen)
const previewModal = document.getElementById("previewModal");
const closeModal = document.getElementById("closeModal");
const previewContent = document.getElementById("previewContent");

let selectedFiles = []; // Files, die der User gerade auswählen will

// --------- Helpers ----------
function fmtBytes(n) {
  const num = Number(n || 0);
  if (!num) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, v = num;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSelected() {
  fileList.innerHTML = "";
  if (selectedFiles.length === 0) return;

  selectedFiles.forEach((f, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="file-info">
        <strong>${escapeHtml(f.name)}</strong>
        <span class="file-meta">${escapeHtml(f.type || "Datei")} • ${fmtBytes(f.size)}</span>
      </div>
      <div class="actions">
        <button class="delete" type="button" data-remove="${idx}">Entfernen</button>
      </div>
    `;
    li.querySelector("[data-remove]").addEventListener("click", () => {
      selectedFiles.splice(idx, 1);
      renderSelected();
    });
    fileList.appendChild(li);
  });
}

function openPreviewInfo(doc) {
  // Da wir aktuell nur Metadaten speichern, zeigen wir Info im Modal.
  previewContent.innerHTML = `
    <div style="text-align:center">
      <h3 style="margin:0 0 8px">Dokument</h3>
      <p style="margin:0 0 10px">${escapeHtml(doc.name || doc.filename || "Dokument")}</p>
      <p style="margin:0;opacity:.8">${fmtBytes(doc.size_bytes || doc.filesize || 0)}</p>
      <p style="margin-top:12px;opacity:.75;font-size:.9rem">
        (Hinweis: Aktuell werden nur Metadaten gespeichert. Für echte Vorschau/Download brauchen wir File-Upload oder Base64 in DB.)
      </p>
    </div>
  `;
  previewModal.style.display = "flex";
}

function closePreview() {
  previewModal.style.display = "none";
  previewContent.innerHTML = "";
}

// --------- Events: Select + Drag&Drop ----------
selectBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files || []);
  fileInput.value = "";
  if (files.length === 0) return;

  // anhängen
  selectedFiles = selectedFiles.concat(files);
  renderSelected();
});

// Wichtig: preventDefault, sonst öffnet Browser die Datei!
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");

  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length === 0) return;

  // optional: nur erlaubte Types
  const allowed = files.filter(f =>
    /pdf|png|jpg|jpeg/i.test(f.type) || /\.(pdf|png|jpe?g)$/i.test(f.name)
  );

  selectedFiles = selectedFiles.concat(allowed);
  renderSelected();
});

// Modal close
closeModal.addEventListener("click", closePreview);
previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal) closePreview();
});

// --------- API: Load/Save/Delete ----------
async function loadUploaded() {
  const r = await api("/api/docs");
  if (!r) return;

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    uploadedList.innerHTML = `<li>Fehler beim Laden: ${escapeHtml(t)}</li>`;
    return;
  }

  const docs = await r.json();
  renderUploaded(docs);
}

function renderUploaded(docs) {
  uploadedList.innerHTML = "";

  if (!docs || docs.length === 0) {
    uploadedList.innerHTML = `<li>— Noch keine Dokumente gespeichert —</li>`;
    return;
  }

  docs.forEach((d) => {
    const li = document.createElement("li");

    const name = d.name || d.filename || "Dokument";
    const size = fmtBytes(d.size_bytes || d.filesize || 0);
    const created = d.created_date ? new Date(d.created_date).toLocaleString("de-DE") : "";

    li.innerHTML = `
      <div class="file-info">
        <strong>${escapeHtml(name)}</strong>
        <span class="file-meta">${size}${created ? " • " + escapeHtml(created) : ""}</span>
      </div>
      <div class="actions">
        <button type="button" data-preview="${d.id}">Ansehen</button>
        <button class="delete" type="button" data-del="${d.id}">Löschen</button>
      </div>
    `;

    li.querySelector("[data-preview]").addEventListener("click", () => openPreviewInfo(d));
    li.querySelector("[data-del]").addEventListener("click", async () => {
      if (!confirm("Dokument wirklich löschen?")) return;
      const rr = await api(`/api/docs/${encodeURIComponent(d.id)}`, { method: "DELETE" });
      if (!rr) return;
      if (!rr.ok) {
        const t = await rr.text().catch(() => "");
        alert("Löschen fehlgeschlagen: " + t);
        return;
      }
      await loadUploaded();
    });

    uploadedList.appendChild(li);
  });
}

uploadBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) {
    alert("Bitte zuerst Dateien auswählen oder per Drag & Drop hinzufügen.");
    return;
  }

  // Aktuelles Backend speichert Metadaten (name + size)
  const docs = selectedFiles.map(f => ({
    name: f.name,
    size_bytes: f.size
  }));

  const r = await api("/api/docs", {
    method: "POST",
    body: JSON.stringify({ docs })
  });

  if (!r) return;

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    alert("Speichern fehlgeschlagen: " + t);
    return;
  }

  // Reset selection + reload
  selectedFiles = [];
  renderSelected();
  await loadUploaded();
});

// Init
renderSelected();
loadUploaded();

});