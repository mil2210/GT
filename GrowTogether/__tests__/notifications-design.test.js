/**
 * Automatisierte Tests für einheitliches Design der Fehlermeldungen
 * 
 * Prüft:
 * - CSS-Klassen und Styles sind korrekt
 * - Farben sind einheitlich (nach Design-System)
 * - Icons sind konsistent
 * - HTML-Struktur ist korrekt
 * - Border und Schatten sind vorhanden
 */

describe("Einheitliches Design der Fehlermeldungen", () => {
  
  beforeEach(() => {
    // Bereinige DOM vor jedem Test
    document.body.innerHTML = "";
    const container = document.getElementById("notificationContainer");
    if (container) container.remove();
  });

  describe("Fehler-Benachrichtigung (Error)", () => {
    test("sollte rote Fehlerfarbe (#dc3545) für Fehler-Benachrichtigungen verwenden", () => {
      notifyError("Test Fehlermeldung");
      
      const notification = document.querySelector(".notification-error");
      expect(notification).toBeTruthy();
      
      const borderColor = notification.getAttribute("data-border-color");
      expect(borderColor).toBe("#dc3545");
    });

    test("sollte roten Hintergrund (#f8d7da) für Fehler-Benachrichtigungen haben", () => {
      notifyError("Test Fehlermeldung");
      
      const notification = document.querySelector(".notification-error");
      const bgColor = notification.getAttribute("data-bg-color");
      expect(bgColor).toBe("#f8d7da");
    });

    test("sollte ✅ oder ❌ Icon für Fehler verwenden", () => {
      notifyError("Test Fehlermeldung");
      
      const notification = document.querySelector(".notification-error");
      const icon = notification.getAttribute("data-icon");
      expect(["❌", "✅"]).toContain(icon);
      expect(notification.innerHTML).toContain(icon);
    });

    test("sollte dunkle Schrift (#721c24) für Fehler verwenden", () => {
      notifyError("Test Fehlermeldung");
      
      const notification = document.querySelector(".notification-error");
      const textColor = notification.getAttribute("data-text-color");
      expect(textColor).toBe("#721c24");
    });

    test("sollte linken Border haben", () => {
      notifyError("Test Fehlermeldung");
      
      const notification = document.querySelector(".notification-error");
      const borderStyle = notification.style.borderLeft;
      expect(borderStyle).toBeTruthy();
      expect(borderStyle).toContain("5px solid");
    });

    test("sollte Box-Shadow für Tiefe haben", () => {
      notifyError("Test Fehlermeldung");
      
      const notification = document.querySelector(".notification-error");
      const shadow = notification.style.boxShadow;
      expect(shadow).toBeTruthy();
      expect(shadow).toContain("20px");
    });
  });

  describe("Erfolgs-Benachrichtigung (Success)", () => {
    test("sollte grüne Erfolgsfarbe (#28a745) verwenden", () => {
      notifySuccess("Test Erfolgsmeldung");
      
      const notification = document.querySelector(".notification-success");
      const borderColor = notification.getAttribute("data-border-color");
      expect(borderColor).toBe("#28a745");
    });

    test("sollte grünen Hintergrund (#d4edda) haben", () => {
      notifySuccess("Test Erfolgsmeldung");
      
      const notification = document.querySelector(".notification-success");
      const bgColor = notification.getAttribute("data-bg-color");
      expect(bgColor).toBe("#d4edda");
    });

    test("sollte grünen Text (#155724) haben", () => {
      notifySuccess("Test Erfolgsmeldung");
      
      const notification = document.querySelector(".notification-success");
      const textColor = notification.getAttribute("data-text-color");
      expect(textColor).toBe("#155724");
    });

    test("sollte ✅ Icon verwenden", () => {
      notifySuccess("Test Erfolgsmeldung");
      
      const notification = document.querySelector(".notification-success");
      const icon = notification.getAttribute("data-icon");
      expect(icon).toBe("✅");
      expect(notification.innerHTML).toContain("✅");
    });
  });

  describe("Warnungs-Benachrichtigung (Warning)", () => {
    test("sollte orange Warnfarbe (#ffc107) verwenden", () => {
      notifyWarning("Test Warnmeldung");
      
      const notification = document.querySelector(".notification-warning");
      const borderColor = notification.getAttribute("data-border-color");
      expect(borderColor).toBe("#ffc107");
    });

    test("sollte orangen Hintergrund (#fff3cd) haben", () => {
      notifyWarning("Test Warnmeldung");
      
      const notification = document.querySelector(".notification-warning");
      const bgColor = notification.getAttribute("data-bg-color");
      expect(bgColor).toBe("#fff3cd");
    });

    test("sollte brauen Text (#856404) haben", () => {
      notifyWarning("Test Warnmeldung");
      
      const notification = document.querySelector(".notification-warning");
      const textColor = notification.getAttribute("data-text-color");
      expect(textColor).toBe("#856404");
    });

    test("sollte ⚠️ Icon verwenden", () => {
      notifyWarning("Test Warnmeldung");
      
      const notification = document.querySelector(".notification-warning");
      const icon = notification.getAttribute("data-icon");
      expect(icon).toBe("⚠️");
      expect(notification.innerHTML).toContain("⚠️");
    });
  });

  describe("Info-Benachrichtigung (Info)", () => {
    test("sollte blaue Info-Farbe (#17a2b8) verwenden", () => {
      notifyInfo("Test Info-Meldung");
      
      const notification = document.querySelector(".notification-info");
      const borderColor = notification.getAttribute("data-border-color");
      expect(borderColor).toBe("#17a2b8");
    });

    test("sollte blauen Hintergrund (#d1ecf1) haben", () => {
      notifyInfo("Test Info-Meldung");
      
      const notification = document.querySelector(".notification-info");
      const bgColor = notification.getAttribute("data-bg-color");
      expect(bgColor).toBe("#d1ecf1");
    });
  });

  describe("Allgemeine Design-Eigenschaften", () => {
    test("alle Benachrichtigungen sollten border-radius: 12px haben", () => {
      notifyError("Fehler");
      notifySuccess("Erfolg");
      notifyWarning("Warnung");
      
      const notifications = document.querySelectorAll("[data-type]");
      notifications.forEach(notif => {
        const borderRadius = notif.style.borderRadius;
        expect(borderRadius).toBe("12px");
      });
    });

    test("alle Benachrichtigungen sollten padding: 18px 24px haben", () => {
      notifyError("Fehler");
      
      const notification = document.querySelector("[data-type]");
      const padding = notification.style.padding;
      expect(padding).toBe("18px 24px");
    });

    test("Benachrichtigungen sollten in Container mit Klasse 'notification-{type}' sein", () => {
      notifyError("Fehler");
      notifySuccess("Erfolg");
      notifyWarning("Warnung");
      
      expect(document.querySelector(".notification-error")).toBeTruthy();
      expect(document.querySelector(".notification-success")).toBeTruthy();
      expect(document.querySelector(".notification-warning")).toBeTruthy();
    });

    test("Notification-Container sollte zentriert oben angezeigt werden", () => {
      notifyError("Test");
      
      const container = document.getElementById("notificationContainer");
      expect(container).toBeTruthy();
      expect(container.style.position).toBe("fixed");
      expect(container.style.top).toBe("20px");
      expect(container.style.left).toBe("50%");
      expect(container.style.zIndex).toBe("9999");
    });

    test("Benachrichtigungen sollten Animation haben", () => {
      notifyError("Test");
      
      const notification = document.querySelector("[data-type]");
      const animation = notification.style.animation;
      expect(animation).toContain("slideDown");
    });
  });

  describe("Konsistenz über mehrere Benachrichtigungen", () => {
    test("mehrere Fehler sollten gleiche Farben haben", () => {
      notifyError("Fehler 1");
      notifyError("Fehler 2");
      
      const errors = document.querySelectorAll(".notification-error");
      expect(errors.length).toBe(2);
      
      const firstColor = errors[0].getAttribute("data-border-color");
      const secondColor = errors[1].getAttribute("data-border-color");
      expect(firstColor).toBe(secondColor);
      expect(firstColor).toBe("#dc3545");
    });

    test("unterschiedliche Typen sollten unterschiedliche Farben haben", () => {
      notifyError("Fehler");
      notifySuccess("Erfolg");
      notifyWarning("Warnung");
      
      const errorColor = document.querySelector(".notification-error")
        .getAttribute("data-border-color");
      const successColor = document.querySelector(".notification-success")
        .getAttribute("data-border-color");
      const warningColor = document.querySelector(".notification-warning")
        .getAttribute("data-border-color");
      
      expect(errorColor).not.toBe(successColor);
      expect(errorColor).not.toBe(warningColor);
      expect(successColor).not.toBe(warningColor);
    });

    test("alle Icons sollten Emojis sein", () => {
      notifyError("Fehler");
      notifySuccess("Erfolg");
      notifyWarning("Warnung");
      notifyInfo("Info");
      
      const notifications = document.querySelectorAll("[data-type]");
      const emojiRegex = /[\p{Emoji}]/u;
      
      notifications.forEach(notif => {
        const icon = notif.getAttribute("data-icon");
        expect(emojiRegex.test(icon)).toBe(true);
      });
    });
  });

  describe("Accessibility und Struktur", () => {
    test("Benachrichtigungen sollten verständliche HTML-Struktur haben", () => {
      notifyError("Test Fehlermeldung");
      
      const notification = document.querySelector("[data-type]");
      expect(notification.innerHTML).toContain("<strong>");
      expect(notification.textContent).toContain("Test Fehlermeldung");
    });

    test("Benachrichtigungen sollten Nachricht enthalten", () => {
      const message = "Dies ist eine sehr wichtige Nachricht!";
      notifySuccess(message);
      
      const notification = document.querySelector(".notification-success");
      expect(notification.textContent).toContain(message);
    });

    test("Nachrichten sollten keine lokalen URLs enthalten", () => {
      const messageWithURL = "Error from http://localhost:3000/api/test";
      notifyError(messageWithURL);
      
      const notification = document.querySelector(".notification-error");
      expect(notification.innerHTML).not.toContain("localhost");
      expect(notification.innerHTML).not.toContain("http://");
    });
  });
});
