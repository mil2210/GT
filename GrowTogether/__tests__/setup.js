/**
 * Jest Setup für DOM-Tests
 * Lädt Mock-Versionen der Notification-Funktionen
 */

// Mock für Notification System (aus notifications.js)
global.showNotification = function(message, type = "info") {
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
  notification.className = `notification notification-${type}`;
  notification.setAttribute("data-type", type);
  
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

  // Speichere die Farben als Attribute für Tests
  notification.setAttribute("data-bg-color", bgColor);
  notification.setAttribute("data-text-color", textColor);
  notification.setAttribute("data-border-color", borderLeftColor);
  notification.setAttribute("data-icon", icon);

  notification.innerHTML = `<strong>${icon}</strong> ${cleanedMessage}`;

  container.appendChild(notification);

  // Entferne die Notification nach 4 Sekunden (für Tests sofort)
  if (process.env.NODE_ENV === "test") {
    setTimeout(() => {
      notification.style.animation = "slideUp 0.3s ease-out forwards";
    }, 4000);
  }
};

// Kurz-Funktionen für häufige Typen
global.notifySuccess = function(message) {
  showNotification(message, "success");
};

global.notifyError = function(message) {
  showNotification(message, "error");
};

global.notifyWarning = function(message) {
  showNotification(message, "warning");
};

global.notifyInfo = function(message) {
  showNotification(message, "info");
};
