// ========== Notification System ==========
// Zeigt schöne, designgerechte Meldungen statt alert()

function showNotification(message, type = "info") {
  // Entferne localhost:3000 und ähnliche Referenzen aus der Nachricht
  const cleanedMessage = message
    .replace(/http:\/\/localhost:\d+\//g, "")
    .replace(/localhost:\d+/g, "")
    .trim();

  // Erstelle den Notification-Container, falls nicht vorhanden
  let container = document.getElementById("notificationContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "notificationContainer";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      font-family: Inter, sans-serif;
      max-width: 500px;
      width: 90%;
    `;
    document.body.appendChild(container);
  }

  // Erstelle die Notification
  const notification = document.createElement("div");
  notification.style.cssText = `
    padding: 18px 24px;
    margin-bottom: 12px;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    animation: slideDown 0.4s ease-out;
    word-wrap: break-word;
    line-height: 1.5;
    font-size: 16px;
    font-weight: 500;
  `;

  // Bestimme Farben basierend auf Typ
  let bgColor, textColor, borderLeftColor;
  let icon = "ℹ️";

  if (type === "success") {
    bgColor = "#d4edda";
    textColor = "#155724";
    borderLeftColor = "#28a745";
    icon = "✅";
  } else if (type === "error") {
    bgColor = "#f8d7da";
    textColor = "#721c24";
    borderLeftColor = "#dc3545";
    icon = "❌";
  } else if (type === "warning") {
    bgColor = "#fff3cd";
    textColor = "#856404";
    borderLeftColor = "#ffc107";
    icon = "⚠️";
  } else {
    // info
    bgColor = "#d1ecf1";
    textColor = "#0c5460";
    borderLeftColor = "#17a2b8";
    icon = "ℹ️";
  }

  notification.style.backgroundColor = bgColor;
  notification.style.color = textColor;
  notification.style.borderLeft = `5px solid ${borderLeftColor}`;

  notification.innerHTML = `<strong>${icon}</strong> ${cleanedMessage}`;

  container.appendChild(notification);

  // Entferne die Notification nach 4 Sekunden
  setTimeout(() => {
    notification.style.animation = "slideUp 0.3s ease-out forwards";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Kurz-Funktionen für häufige Typen
function notifySuccess(message) {
  showNotification(message, "success");
}

function notifyError(message) {
  showNotification(message, "error");
}

function notifyWarning(message) {
  showNotification(message, "warning");
}

function notifyInfo(message) {
  showNotification(message, "info");
}

// ========== Confirmation Dialog ==========
function showConfirmDialog(message, title = "Bestätigung") {
  return new Promise((resolve) => {
    // Erstelle Overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.2s ease-out;
    `;

    // Erstelle Dialog
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.3s ease-out;
      font-family: Inter, sans-serif;
    `;

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin: 0 0 12px 0;
      color: #625548;
      font-size: 20px;
      font-weight: 700;
    `;

    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    messageEl.style.cssText = `
      margin: 0 0 24px 0;
      color: #625548;
      font-size: 15px;
      line-height: 1.5;
      opacity: 0.8;
    `;

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Abbrechen";
    cancelBtn.style.cssText = `
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #e8e8e8;
      color: #625548;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s;
    `;
    cancelBtn.onmouseover = () => (cancelBtn.style.background = "#d8d8d8");
    cancelBtn.onmouseout = () => (cancelBtn.style.background = "#e8e8e8");
    cancelBtn.onclick = () => {
      overlay.style.animation = "fadeOut 0.2s ease-out forwards";
      dialog.style.animation = "slideDown 0.2s ease-out forwards";
      setTimeout(() => overlay.remove(), 200);
      resolve(false);
    };

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Ja, löschen";
    confirmBtn.style.cssText = `
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #dc3545;
      color: white;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: background 0.2s;
    `;
    confirmBtn.onmouseover = () => (confirmBtn.style.background = "#c82333");
    confirmBtn.onmouseout = () => (confirmBtn.style.background = "#dc3545");
    confirmBtn.onclick = () => {
      overlay.style.animation = "fadeOut 0.2s ease-out forwards";
      dialog.style.animation = "slideDown 0.2s ease-out forwards";
      setTimeout(() => overlay.remove(), 200);
      resolve(true);
    };

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);

    dialog.appendChild(titleEl);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // ESC zum Abbrechen
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", handleEsc);
        cancelBtn.click();
      }
    };
    document.addEventListener("keydown", handleEsc);
  });
}

// Spezielle Funktion für Lösch-Bestätigungen
async function confirmDelete(itemName = "Element") {
  return await showConfirmDialog(
    `${itemName} kann nicht wiederhergestellt werden.`,
    `${itemName} wirklich löschen?`
  );
}

// Spezielle Funktion für Abmeldung
async function confirmLogout() {
  return await showConfirmDialog(
    "Du wirst aus deinem Konto abgemeldet.",
    "Möchtest du dich wirklich abmelden?"
  );
}

// Füge CSS Animationen hinzu
const style = document.createElement("style");
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateX(-50%) translateY(-30px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    to {
      transform: translateX(-50%) translateY(-30px);
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
