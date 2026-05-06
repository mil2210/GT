
// ---------- API Helper ----------
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

// ---------- Login Check ----------
const currentUser = localStorage.getItem("gt_loggedin");
if (!currentUser || !getToken()) {
  window.location.href = "login.html";
}

// ---------- Logout ----------
async function logout() {
  const confirmed = await confirmLogout();
  if (confirmed) {
    localStorage.removeItem("gt_loggedin");
    localStorage.removeItem("gt_token");
    window.location.href = "login.html";
  }
}

// ---------- Helpers ----------
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isISODate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

// Nur Ziffern erlauben (auch bei Copy/Paste)
function digitsOnly(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const normalize = () => {
    const cleaned = el.value.replace(/\D/g, "");
    if (el.value !== cleaned) el.value = cleaned;
  };

  el.addEventListener("input", normalize);
  el.addEventListener("paste", () => setTimeout(normalize, 0));
  normalize();
}

/**
 * Date-Limiter ohne "Spam":
 * - setzt min/max
 * - prüft erst bei CHANGE (wenn Datum fertig ist)
 * - wenn Value nicht YYYY-MM-DD => kein Alert
 */
function limitDateField(id, minISO) {
  const el = document.getElementById(id);
  if (!el) return;

  el.min = minISO;
  el.max = todayISO();
}

function assertDigitsOnlyValue(value) {
  if (!value) return true;
  return /^\d+$/.test(value);
}

function assertBirthdate(value, minISO) {
  if (!value) return true;
  if (!isISODate(value)) {
    return false;
  }
  const t = todayISO();
  const isValid = value >= minISO && value <= t;
  return isValid;
}

// ---------- Collect ----------
function val(id) {
  return document.getElementById(id)?.value ?? "";
}

function numOrNull(id) {
  const v = val(id).trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ---------- Load from DB ----------
function resetUI() {
  // Mother
  [
    "mutterName",
    "mutterGebDatum",
    "mutterAdresse",
    "mutterKontakt",
    "mutterVersicherungsNr",
    "mutterBlutgruppe",
    "mutterVorerkrankungen",
    "mutterAllergien",
    "mutterMedikamente",
    "mutterFruehereSS",
    "mutterBeruf",
    "mutterRisiken"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // Father
  [
    "vaterName",
    "vaterGebDatum",
    "vaterAdresse",
    "vaterKontakt",
    "vaterBeruf",
    "vaterAllergien",
    "vaterMedikamente"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // Child
  [
    "kindName",
    "kindGebDatum",
    "kindGebZeit",
    "kindGebOrt",
    "kindGewicht",
    "kindGroesse",
    "kindKopfumfang",
    "kindAPGAR",
    "kindBlutgruppe",
    "kindScreening"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

async function loadAll() {
  // Wichtig: UI immer deterministisch machen -> keine "alten" Werte stehen lassen
  resetUI();

  const rm = await api("/api/profile/mother");
  const rc = await api("/api/profile/child");
  const rf = await api("/api/profile/father");

  if (!rm || !rc || !rf) {
    notifyWarning("Stammdaten konnten nicht geladen werden.");
    return;
  }

  // Falls API fehlschlägt (z.B. DB), UI bleibt deterministisch leer (resetUI bereits ausgeführt)
  if (!rm.ok || !rc.ok || !rf.ok) {
    notifyWarning("Stammdaten konnten nicht vollständig geladen werden.");
    return;
  }

  const mother = await rm.json();
  const child = await rc.json();
  const father = await rf.json();

  // mother -> inputs
  if (mother) {
    if (mother.name != null) document.getElementById("mutterName").value = mother.name;
    if (mother.birth_date != null) document.getElementById("mutterGebDatum").value = mother.birth_date;
    if (mother.address != null) document.getElementById("mutterAdresse").value = mother.address;
    if (mother.contact != null) document.getElementById("mutterKontakt").value = mother.contact;
    if (mother.insurance_number != null) document.getElementById("mutterVersicherungsNr").value = mother.insurance_number;
    if (mother.blood_group != null) document.getElementById("mutterBlutgruppe").value = mother.blood_group;
    if (mother.preconditions != null) document.getElementById("mutterVorerkrankungen").value = mother.preconditions;
    if (mother.allergies != null) document.getElementById("mutterAllergien").value = mother.allergies;
    if (mother.medications != null) document.getElementById("mutterMedikamente").value = mother.medications;
    if (mother.previous_pregnancies != null) document.getElementById("mutterFruehereSS").value = mother.previous_pregnancies;
    if (mother.profession != null) document.getElementById("mutterBeruf").value = mother.profession;
    if (mother.risks != null) document.getElementById("mutterRisiken").value = mother.risks;
  }

  // father -> inputs
  if (father) {
    if (father.name != null) document.getElementById("vaterName").value = father.name;
    if (father.birth_date != null) document.getElementById("vaterGebDatum").value = father.birth_date;
    if (father.address != null) document.getElementById("vaterAdresse").value = father.address;
    if (father.contact != null) document.getElementById("vaterKontakt").value = father.contact;
    if (father.profession != null) document.getElementById("vaterBeruf").value = father.profession;
    if (father.allergies != null) document.getElementById("vaterAllergien").value = father.allergies;
    if (father.medications != null) document.getElementById("vaterMedikamente").value = father.medications;
  }

  // child -> inputs
  if (child) {
    if (child.name != null) document.getElementById("kindName").value = child.name;
    if (child.birth_date != null) document.getElementById("kindGebDatum").value = child.birth_date;
    if (child.birth_time != null) document.getElementById("kindGebZeit").value = child.birth_time;
    if (child.birth_place != null) document.getElementById("kindGebOrt").value = child.birth_place;
    if (child.weight != null) document.getElementById("kindGewicht").value = child.weight;
    if (child.height != null) document.getElementById("kindGroesse").value = child.height;
    if (child.head_circumference != null) document.getElementById("kindKopfumfang").value = child.head_circumference;
    if (child.apgar != null) document.getElementById("kindAPGAR").value = child.apgar;
    if (child.blood_group != null) document.getElementById("kindBlutgruppe").value = child.blood_group;
    if (child.screening != null) document.getElementById("kindScreening").value = child.screening;
  }

  if (!mother && !child && !father) {
    notifyWarning("Noch keine Stammdaten gespeichert.");
  }
}


// ---------- Save ----------
async function saveMother() {
  const geb = val("mutterGebDatum");
  const vers = val("mutterVersicherungsNr").trim();

  // ✅ realistischer: Mutter ab 1940 (kannst du auf 1900 zurückstellen wenn nötig)
  if (!assertBirthdate(geb, "1940-01-01")) {
    notifyWarning("Mutter-Geburtsdatum ist unrealistisch (min 1940, max heute).");
    return;
  }
  if (!assertDigitsOnlyValue(vers)) {
    notifyWarning("Versicherungsnummer darf nur Zahlen enthalten.");
    return;
  }

  const payload = {
    name: val("mutterName").trim(),
    birth_date: geb || null,
    address: val("mutterAdresse").trim(),
    contact: val("mutterKontakt").trim(),
    insurance_number: vers || "",
    blood_group: val("mutterBlutgruppe").trim(),
    preconditions: val("mutterVorerkrankungen").trim(),
    allergies: val("mutterAllergien").trim(),
    medications: val("mutterMedikamente").trim(),
    previous_pregnancies: val("mutterFruehereSS").trim(),
    profession: val("mutterBeruf").trim(),
    risks: val("mutterRisiken").trim()
  };

  const r = await api("/api/profile/mother", { method: "PUT", body: JSON.stringify(payload) });
  if (!r) return;
  if (!r.ok) return notifyError("Fehler beim Speichern (Mutter)");
  notifySuccess("Mutter-Stammdaten gespeichert!");
}

async function saveChild() {
  const geb = val("kindGebDatum");

  if (!assertBirthdate(geb, "1900-01-01")) {
    notifyWarning("Kind-Geburtsdatum ist unrealistisch (min 1900, max heute).");
    return;
  }


  const payload = {
    name: val("kindName").trim(),
    birth_date: geb || null,
    birth_time: val("kindGebZeit").trim() || null,
    birth_place: val("kindGebOrt").trim(),
    weight: numOrNull("kindGewicht"),
    height: numOrNull("kindGroesse"),
    head_circumference: numOrNull("kindKopfumfang"),
    apgar: val("kindAPGAR").trim(),
    blood_group: val("kindBlutgruppe").trim(),
    screening: val("kindScreening").trim()
  };

  const r = await api("/api/profile/child", { method: "PUT", body: JSON.stringify(payload) });
  if (!r) return;
  if (!r.ok) return notifyError("Fehler beim Speichern (Kind)");
  notifySuccess("Kind-Stammdaten gespeichert!");
}

async function saveFather() {
  const geb = val("vaterGebDatum");

  // ✅ Vater ab 1940 (realistisch)
  if (!assertBirthdate(geb, "1940-01-01")) {
    notifyWarning("Vater-Geburtsdatum ist unrealistisch (min 1940, max heute).");
    return;
  }

  const payload = {
    name: val("vaterName").trim(),
    birth_date: geb || null,
    address: val("vaterAdresse").trim(),
    contact: val("vaterKontakt").trim(),
    profession: val("vaterBeruf").trim(),
    allergies: val("vaterAllergien").trim(),
    medications: val("vaterMedikamente").trim()
  };

  const r = await api("/api/profile/father", { method: "PUT", body: JSON.stringify(payload) });
  if (!r) return;
  if (!r.ok) return notifyError("Fehler beim Speichern (Vater)");
  notifySuccess("Vater-Stammdaten gespeichert!");
}

// ---------- Accordion + Init ----------
window.addEventListener("DOMContentLoaded", async () => {
  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Accordion
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      const targetId = header.getAttribute("data-target");
      const content = document.getElementById(targetId);
      header.classList.toggle("active");
      content?.classList.toggle("active");
    });
  });

  // Standardmäßig öffnen wie vorher (Index 0 und 3)
  const headers = document.querySelectorAll(".accordion-header");
  if (headers[0]) headers[0].click();
  if (headers[3]) headers[3].click();

  // ✅ Live constraints (ohne Spam)
  digitsOnly("mutterVersicherungsNr");
  // Datumfelder werden direkt vom Browser validiert via min/max Attribute
  const mutterGeb = document.getElementById("mutterGebDatum");
  const vaterGeb = document.getElementById("vaterGebDatum");
  const kindGeb = document.getElementById("kindGebDatum");
  if (mutterGeb) { mutterGeb.min = "1940-01-01"; mutterGeb.max = todayISO(); }
  if (vaterGeb) { vaterGeb.min = "1940-01-01"; vaterGeb.max = todayISO(); }
  if (kindGeb) { kindGeb.min = "1900-01-01"; kindGeb.max = todayISO(); }


  // Save Buttons
  const saveMotherBtn = document.getElementById("saveMotherBtn");
  const saveFatherBtn = document.getElementById("saveFatherBtn");
  const saveChildBtn = document.getElementById("saveChildBtn");
  if (saveMotherBtn) saveMotherBtn.addEventListener("click", saveMother);
  if (saveFatherBtn) saveFatherBtn.addEventListener("click", saveFather);
  if (saveChildBtn) saveChildBtn.addEventListener("click", saveChild);

  await loadAll();
});
