# Automatisierte Tests für Stammdaten

## Übersicht

Es wurden zwei umfassende Test-Suites erstellt, um die Qualität und Konsistenz der Stammdaten-Verwaltung zu gewährleisten:

### 1. **Test-Suite: Einheitliches Design der Fehlermeldungen** 
📄 Datei: `__tests__/notifications-design.test.js`

Diese Test-Suite prüft automatisiert, dass alle Benachrichtigungen (Fehler, Erfolg, Warnung, Info) ein konsistentes und einheitliches Design-System folgen.

#### Was wird getestet:

- **Farben-Konsistenz:**
  - Fehler: Rote Farben (#dc3545, #f8d7da, #721c24)
  - Erfolg: Grüne Farben (#28a745, #d4edda, #155724)
  - Warnung: Orange Farben (#ffc107, #fff3cd, #856404)
  - Info: Blaue Farben (#17a2b8, #d1ecf1)

- **Icons und Emojis:**
  - ❌ für Fehler
  - ✅ für Erfolg
  - ⚠️ für Warnung
  - ℹ️ für Info

- **CSS-Klassen und Styles:**
  - border-radius: 12px
  - padding: 18px 24px
  - box-shadow: 0 6px 20px
  - linker Border (5px solid)

- **HTML-Struktur:**
  - Korrekte DOM-Elemente
  - Richtige CSS-Klassen
  - Daten-Attribute für Tests

- **Konsistenz über mehrere Benachrichtigungen**
- **Accessibility**

#### Tests ausführen:

```bash
npm test -- --testNamePattern="Einheitliches Design"
```

**Anzahl Tests:** 28 ✅

---

### 2. **Test-Suite: Erfolgsmeldung nach Speichern der Stammdaten**
📄 Datei: `__tests__/stammdaten-success.test.js`

Diese Test-Suite prüft automatisiert, dass eine Erfolgsmeldung angezeigt wird, nachdem Stammdaten erfolgreich gespeichert wurden.

#### Was wird getestet:

- **Erfolgreiche Speicherung:**
  - Erfolgsmeldung wird nach erfolgreicher API-Antwort angezeigt
  - Für Mutter-Stammdaten
  - Für Kind-Stammdaten
  - Für Vater-Stammdaten

- **Benachrichtigungs-Design:**
  - Grüne Farbe (#28a745)
  - ✅ Icon
  - Korrekte Padding, Border-Radius, Box-Shadow

- **Fehlerfälle:**
  - Keine Erfolgsmeldung bei fehlgeschlagener Speicherung
  - Fehlermeldungen bei API-Fehlern (400, 401, 500)

- **Mehrfaches Speichern:**
  - Mehrere Erfolgsmeldungen können gleichzeitig angezeigt werden
  - Alle haben konsistentes Design

- **Kombination mit anderen Benachrichtigungen:**
  - Erfolg- und Fehlermeldungen sind deutlich unterscheidbar
  - Verschiedene Benachrichtigungstypen können gleichzeitig angezeigt werden

- **API-Integration:**
  - Fetch wird mit korrekten Headers aufgerufen
  - Verschiedene HTTP-Status-Codes werden korrekt behandelt

#### Tests ausführen:

```bash
npm test -- --testNamePattern="Erfolgsmeldung nach Speichern"
```

**Anzahl Tests:** 20 ✅

---

## Alle Tests ausführen

```bash
# Alle Tests
npm test

# Nur die neuen Tests für Stammdaten
npm test -- __tests__/notifications-design.test.js __tests__/stammdaten-success.test.js

# Mit Beobachtungsmodus (watch mode)
npm test -- --watch

# Mit Coverage
npm test -- --coverage
```

---

## Technische Details

### Konfiguration

- **Test-Umgebung:** jsdom (für DOM-Tests)
- **Setup-Datei:** `__tests__/setup.js` (lädt Notification-Funktionen)
- **Test-Framework:** Jest

### Mock-Funktionen in `__tests__/setup.js`

Diese globalen Funktionen sind in jedem Test verfügbar:
- `showNotification(message, type)`
- `notifySuccess(message)`
- `notifyError(message)`
- `notifyWarning(message)`
- `notifyInfo(message)`

### DOM-Simulation

Die Tests verwenden jsdom zur Simulation des DOM und testen:
- HTML-Struktur und CSS-Klassen
- Computed Styles und Inline-Styles
- Daten-Attribute
- DOM-Hierarchie

---

## Qualitätssicherung

Diese automatisierten Tests gewährleisten:

✅ **Designkonsistenz** - Alle Benachrichtigungen folgen dem gleichen Design-System

✅ **Benutzererfahrung** - Benutzer erhalten klare, konsistent gestaltete Rückmeldungen

✅ **Wartbarkeit** - Bei Design-Änderungen werden sofort alle betroffenen Stellen erkannt

✅ **Regressionsprävention** - Zukünftige Änderungen können nicht versehentlich die Konsistenz beeinträchtigen

---

## Ergebnisse

```
✅ notifications-design.test.js: 28/28 Tests bestanden
✅ stammdaten-success.test.js: 20/20 Tests bestanden
✅ Gesamt: 48 neue Tests erfolgreich
```

---

## Anpassung der Tests

Falls das Design oder die Fehlermeldungen geändert werden:

1. **Farben ändern:** Aktualisieren Sie die Farb-Konstanten in `notifications.js` und die erwarteten Werte in den Tests

2. **Icons ändern:** Passen Sie die Icon-Zeichen in `notifications.js` und den Tests an

3. **Neue Benachrichtigungstypen:** Erstellen Sie neue Test-Blöcke im selben Format

4. **Neue Erfolgsmeldungen:** Ergänzen Sie die Tests in `stammdaten-success.test.js`

---

## Weitere Informationen

- [Jest Dokumentation](https://jestjs.io/)
- [jsdom Dokumentation](https://github.com/jsdom/jsdom)
- [Testing Best Practices](https://jestjs.io/docs/getting-started)
