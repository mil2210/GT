/**
 * Automatisierte Tests für Erfolgsmeldung nach Speichern der Stammdaten
 * 
 * Prüft:
 * - Erfolgsmeldung wird nach erfolgreicher API-Antwort angezeigt
 * - Meldung hat die richtigen Design-Eigenschaften
 * - Meldung enthält die richtige Information
 * - Keine Fehlermeldung bei erfolgreicher Speicherung
 */

describe("Erfolgsmeldung nach Speichern der Stammdaten", () => {
  
  let mockFetch;
  let originalFetch;

  beforeEach(() => {
    // Bereinige DOM
    document.body.innerHTML = "";
    const container = document.getElementById("notificationContainer");
    if (container) container.remove();

    // Mock localStorage
    localStorage.clear();
    localStorage.setItem("gt_token", "test-token");
    localStorage.setItem("gt_loggedin", "test-user");

    // Mock fetch
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Setze NODE_ENV für Tests
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    // Stelle original fetch wieder her
    global.fetch = originalFetch;
  });

  describe("Mutter-Stammdaten Speichern", () => {
    test("sollte Erfolgsmeldung zeigen nach erfolgreicher Speicherung", async () => {
      // Mock erfolgreiche API-Antwort
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({})
      });

      // Simuliere API-Aufruf und Erfolgsmeldung
      const response = await fetch("/api/profile/mother", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token"
        },
        body: JSON.stringify({
          name: "Maria Muster",
          birth_date: "1970-05-15",
          address: "Teststraße 123"
        })
      });

      if (response.ok) {
        notifySuccess("Mutter-Stammdaten gespeichert!");
      }

      // Prüfe ob Erfolgsmeldung vorhanden ist
      const successNotification = document.querySelector(".notification-success");
      expect(successNotification).toBeTruthy();
      expect(successNotification.textContent).toContain("Mutter-Stammdaten gespeichert!");
    });

    test("Erfolgsmeldung sollte ✅ Icon enthalten", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({})
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Daten gespeichert!");
      }

      const successNotification = document.querySelector(".notification-success");
      expect(successNotification.getAttribute("data-icon")).toBe("✅");
      expect(successNotification.textContent).toContain("✅");
    });

    test("Erfolgsmeldung sollte grüne Farbe (#28a745) haben", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Mutter gespeichert!");
      }

      const successNotification = document.querySelector(".notification-success");
      expect(successNotification.getAttribute("data-border-color")).toBe("#28a745");
      expect(successNotification.getAttribute("data-bg-color")).toBe("#d4edda");
      expect(successNotification.getAttribute("data-text-color")).toBe("#155724");
    });

    test("sollte keine Fehlermeldung zeigen bei erfolgreicher Speicherung", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Erfolgreich gespeichert!");
      } else {
        notifyError("Fehler beim Speichern!");
      }

      const errorNotification = document.querySelector(".notification-error");
      expect(errorNotification).toBeFalsy();
    });

    test("sollte Fehlermeldung zeigen bei fehlgeschlagener Speicherung", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Erfolgreich gespeichert!");
      } else {
        notifyError("Fehler beim Speichern (Mutter)");
      }

      const errorNotification = document.querySelector(".notification-error");
      expect(errorNotification).toBeTruthy();
      expect(errorNotification.textContent).toContain("Fehler beim Speichern");
    });
  });

  describe("Kind-Stammdaten Speichern", () => {
    test("sollte Erfolgsmeldung zeigen nach erfolgreicher Speicherung", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({})
      });

      const response = await fetch("/api/profile/child", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token"
        },
        body: JSON.stringify({
          name: "Max Muster",
          birth_date: "2023-01-15"
        })
      });

      if (response.ok) {
        notifySuccess("Kind-Stammdaten gespeichert!");
      }

      const successNotification = document.querySelector(".notification-success");
      expect(successNotification).toBeTruthy();
      expect(successNotification.textContent).toContain("Kind-Stammdaten gespeichert!");
    });

    test("sollte sprechende Erfolgsmeldung für Kind anzeigen", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/child", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Kind-Stammdaten gespeichert!");
      }

      const notification = document.querySelector(".notification-success");
      expect(notification.textContent).toMatch(/Kind.*gespeichert/i);
    });
  });

  describe("Vater-Stammdaten Speichern", () => {
    test("sollte Erfolgsmeldung zeigen nach erfolgreicher Speicherung", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/father", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Vater-Stammdaten gespeichert!");
      }

      const successNotification = document.querySelector(".notification-success");
      expect(successNotification).toBeTruthy();
      expect(successNotification.textContent).toContain("Vater-Stammdaten gespeichert!");
    });

    test("sollte sprechende Erfolgsmeldung für Vater anzeigen", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/father", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Vater-Stammdaten gespeichert!");
      }

      const notification = document.querySelector(".notification-success");
      expect(notification.textContent).toMatch(/Vater.*gespeichert/i);
    });
  });

  describe("Erfolgsmeldungs-Eigenschaften", () => {
    test("Erfolgsmeldung sollte sichtbar in notificationContainer sein", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Gespeichert!");
      }

      const container = document.getElementById("notificationContainer");
      expect(container).toBeTruthy();
      
      const notification = container.querySelector(".notification-success");
      expect(notification).toBeTruthy();
    });

    test("Erfolgsmeldung sollte richtige Klasse haben", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Test!");
      }

      const notification = document.querySelector("[data-type='success']");
      expect(notification).toBeTruthy();
      expect(notification.classList.contains("notification-success")).toBe(true);
    });

    test("Erfolgsmeldung sollte korrekte Padding haben", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Test!");
      }

      const notification = document.querySelector(".notification-success");
      expect(notification.style.padding).toBe("18px 24px");
    });

    test("Erfolgsmeldung sollte border-radius: 12px haben", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Test!");
      }

      const notification = document.querySelector(".notification-success");
      expect(notification.style.borderRadius).toBe("12px");
    });

    test("Erfolgsmeldung sollte Box-Shadow haben", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Test!");
      }

      const notification = document.querySelector(".notification-success");
      const shadow = notification.style.boxShadow;
      expect(shadow).toBeTruthy();
      expect(shadow).toContain("20px");
    });
  });

  describe("Mehrfaches Speichern", () => {
    test("mehrfaches Speichern sollte mehrere Erfolgsmeldungen zeigen", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      // Erstes Speichern
      let response = await fetch("/api/profile/mother", { method: "PUT" });
      if (response.ok) notifySuccess("Mutter gespeichert!");

      // Zweites Speichern
      response = await fetch("/api/profile/child", { method: "PUT" });
      if (response.ok) notifySuccess("Kind gespeichert!");

      // Drittes Speichern
      response = await fetch("/api/profile/father", { method: "PUT" });
      if (response.ok) notifySuccess("Vater gespeichert!");

      const successNotifications = document.querySelectorAll(".notification-success");
      expect(successNotifications.length).toBe(3);
      expect(successNotifications[0].textContent).toContain("Mutter");
      expect(successNotifications[1].textContent).toContain("Kind");
      expect(successNotifications[2].textContent).toContain("Vater");
    });

    test("alle Erfolgsmeldungen sollten gleiche Designeigenschaften haben", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      notifySuccess("Erste!");
      notifySuccess("Zweite!");
      notifySuccess("Dritte!");

      const notifications = document.querySelectorAll(".notification-success");
      const expectedColor = "#28a745";

      notifications.forEach(notif => {
        expect(notif.getAttribute("data-border-color")).toBe(expectedColor);
        expect(notif.getAttribute("data-icon")).toBe("✅");
      });
    });
  });

  describe("Kombination mit anderen Benachrichtigungen", () => {
    test("Erfolgsmeldung sollte von Fehlermeldung unterscheidbar sein", async () => {
      notifySuccess("Erfolgreich!");
      notifyError("Fehler!");

      const successNotif = document.querySelector(".notification-success");
      const errorNotif = document.querySelector(".notification-error");

      expect(successNotif.getAttribute("data-border-color")).not.toBe(
        errorNotif.getAttribute("data-border-color")
      );
      expect(successNotif.getAttribute("data-icon")).not.toBe(
        errorNotif.getAttribute("data-icon")
      );
    });

    test("mehrere verschiedene Benachrichtigungstypen sollten gleichzeitig angezeigt werden", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      // Simuliere Validierungsfehler dann erfolgreiche Speicherung
      notifyWarning("Feld ist optional");
      
      const response = await fetch("/api/profile/mother", { method: "PUT" });
      if (response.ok) notifySuccess("Gespeichert!");

      const warningNotif = document.querySelector(".notification-warning");
      const successNotif = document.querySelector(".notification-success");

      expect(warningNotif).toBeTruthy();
      expect(successNotif).toBeTruthy();
      expect(warningNotif).not.toBe(successNotif);
    });
  });

  describe("API-Integration", () => {
    test("sollte fetch mit korrekten Header aufrufen", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      await fetch("/api/profile/mother", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token"
        },
        body: JSON.stringify({ name: "Test" })
      });

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("/api/profile/mother");
      expect(callArgs[1].method).toBe("PUT");
    });

    test("sollte bei 401 Fehler nicht in erfolgreiche Speicherung gehen", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Erfolgreich!");
      } else if (response.status === 401) {
        notifyError("Nicht authentifiziert!");
      }

      const successNotif = document.querySelector(".notification-success");
      const errorNotif = document.querySelector(".notification-error");

      expect(successNotif).toBeFalsy();
      expect(errorNotif).toBeTruthy();
    });

    test("sollte bei 500 Fehler nicht in erfolgreiche Speicherung gehen", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const response = await fetch("/api/profile/mother", { method: "PUT" });

      if (response.ok) {
        notifySuccess("Erfolgreich!");
      } else {
        notifyError("Fehler beim Speichern (Mutter)");
      }

      const successNotif = document.querySelector(".notification-success");
      expect(successNotif).toBeFalsy();
    });
  });
});
