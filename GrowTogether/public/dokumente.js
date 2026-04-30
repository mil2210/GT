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
  // Lade die Datei vom Server
  loadAndPreviewFile(doc.id, doc.filename || doc.name);
}

async function loadAndPreviewFile(docId, filename) {
  try {
    const r = await api(`/api/docs/${encodeURIComponent(docId)}/preview`);
    if (!r) return;

    if (!r.ok) {
      previewContent.innerHTML = `<p style="color:red">Fehler beim Laden: ${r.status}</p>`;
      previewModal.style.display = "flex";
      return;
    }

    const { mimeType, data } = await r.json();
    const dataUri = `data:${mimeType};base64,${data}`;

    // Display based on type
    if (mimeType.startsWith("image/")) {
      previewContent.innerHTML = `<img src="${dataUri}" alt="Preview" style="max-width:100%; max-height:70vh; border-radius:8px;">`;
    } else if (mimeType === "application/pdf") {
      previewContent.innerHTML = `
        <div style="text-align:center;">
          <p style="margin-bottom:12px;color:#625548;font-weight:600;">📄 PDF-Vorschau</p>
          <embed src="${dataUri}" type="application/pdf" width="100%" height="500px" style="border-radius:8px;">
        </div>
      `;
    } else {
      previewContent.innerHTML = `
        <div style="text-align:center;padding:20px;">
          <p style="color:#625548;margin-bottom:12px;">📄 ${escapeHtml(filename)}</p>
          <p style="opacity:0.7;margin-bottom:16px;">Dateivorschau nicht verfügbar</p>
          <button onclick="downloadFile(${docId}, '${escapeHtml(filename)}')" style="
            padding:10px 20px;
            border:none;
            border-radius:12px;
            background:linear-gradient(135deg, #e7d0b9, #d2bba4);
            color:#625548;
            cursor:pointer;
            font-weight:600;
            box-shadow: 0 4px 10px rgba(0,0,0,0.12);
          ">⬇️ Herunterladen</button>
        </div>
      `;
    }

    previewModal.style.display = "flex";
  } catch (e) {
    console.error(e);
    previewContent.innerHTML = `<p style="color:red">Fehler beim Laden der Vorschau</p>`;
    previewModal.style.display = "flex";
  }
}

window.downloadFile = async function(docId, filename) {
  try {
    const r = await api(`/api/docs/${encodeURIComponent(docId)}/file`);
    if (!r) return;

    if (!r.ok) {
      alert("Download fehlgeschlagen");
      return;
    }

    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert("Fehler beim Download");
  }
};

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
        <button type="button" data-preview="${d.id}">👁️ Ansehen</button>
        <button type="button" data-download="${d.id}" data-filename="${escapeHtml(name)}">⬇️ Download</button>
        <button class="delete" type="button" data-del="${d.id}">🗑️ Löschen</button>
      </div>
    `;

    li.querySelector("[data-preview]").addEventListener("click", () => openPreviewInfo(d));
    
    li.querySelector("[data-download]").addEventListener("click", async () => {
      await downloadFile(d.id, d.filename || d.name);
    });
    
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

  uploadBtn.disabled = true;
  uploadBtn.textContent = "⏳ Wird hochgeladen...";

  try {
    // Konvertiere Dateien zu Base64
    const docs = [];
    for (const f of selectedFiles) {
      const file_data = await fileToBase64(f);
      docs.push({
        name: f.name,
        size_bytes: f.size,
        file_data
      });
    }

    const r = await api("/api/docs", {
      method: "POST",
      body: JSON.stringify({ docs })
    });

    if (!r) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Dokumente speichern";
      return;
    }

    if (!r.ok) {
      let errorMsg = "Speichern fehlgeschlagen";
      try {
        const errorData = await r.json();
        if (errorData.error === "duplicate files" && errorData.duplicates) {
          errorMsg = "Die folgenden Dateien existieren bereits:\n\n" + errorData.duplicates.join("\n");
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch (e) {
        const t = await r.text().catch(() => "");
        if (t) errorMsg = t;
      }
      alert(errorMsg);
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Dokumente speichern";
      return;
    }

    // Reset selection + reload
    selectedFiles = [];
    renderSelected();
    await loadUploaded();
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Dokumente speichern";
  } catch (e) {
    console.error(e);
    alert("Fehler beim Upload: " + e.message);
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Dokumente speichern";
  }
});

// Hilfsfunktion zum Konvertieren von Dateien zu Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Extrahiere den Base64-Teil nach dem Komma
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Init
renderSelected();
loadUploaded();

});