/**
 * Jest Tests für Hilfsfunktionen (Utils)
 * 
 * Diese Tests prüfen die Hilfsfunktionen die im Server und Frontend verwendet werden.
 */

const crypto = require('crypto');

// Hilfsfunktionen aus dem Server nachgebildet
function sha256(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

// Hilfsfunktionen aus stammdaten.js
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

// Hilfsfunktion aus kalender.js
function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Hilfsfunktion aus dokumente.js
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

describe('SHA256 Hash Funktion', () => {
    test('sollte korrekten Hash für ein Passwort generieren', () => {
        const hash = sha256('password123');
        expect(hash).toBe('ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f');
    });

    test('sollte verschiedene Hashes für verschiedene Eingaben generieren', () => {
        const hash1 = sha256('password1');
        const hash2 = sha256('password2');
        expect(hash1).not.toBe(hash2);
    });

    test('sollte gleichen Hash für gleiche Eingabe generieren', () => {
        const hash1 = sha256('samepassword');
        const hash2 = sha256('samepassword');
        expect(hash1).toBe(hash2);
    });

    test('sollte 64 Zeichen langen Hex-String zurückgeben', () => {
        const hash = sha256('test');
        expect(hash.length).toBe(64);
        expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    test('sollte auch mit Sonderzeichen funktionieren', () => {
        const hash = sha256('Passwort!@#$%^&*()_+');
        expect(hash.length).toBe(64);
    });

    test('sollte mit leerem String funktionieren', () => {
        const hash = sha256('');
        expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
});

describe('Datum Hilfsfunktionen', () => {
    describe('todayISO()', () => {
        test('sollte heutiges Datum im ISO-Format zurückgeben', () => {
            const today = todayISO();
            expect(isISODate(today)).toBe(true);
        });

        test('sollte Format YYYY-MM-DD haben', () => {
            const today = todayISO();
            const parts = today.split('-');
            expect(parts.length).toBe(3);
            expect(parts[0].length).toBe(4); // Jahr
            expect(parts[1].length).toBe(2); // Monat
            expect(parts[2].length).toBe(2); // Tag
        });
    });

    describe('isISODate()', () => {
        test('sollte true für gültiges ISO-Datum zurückgeben', () => {
            expect(isISODate('2026-01-15')).toBe(true);
            expect(isISODate('2025-12-31')).toBe(true);
            expect(isISODate('1999-01-01')).toBe(true);
        });

        test('sollte false für ungültiges Format zurückgeben', () => {
            expect(isISODate('15-01-2026')).toBe(false); // Deutsches Format
            expect(isISODate('01/15/2026')).toBe(false); // US Format
            expect(isISODate('2026-1-15')).toBe(false);  // Kein führendes Null
            expect(isISODate('2026-01-5')).toBe(false);  // Kein führendes Null
        });

        test('sollte false für leeren oder ungültigen Input zurückgeben', () => {
            expect(isISODate('')).toBe(false);
            expect(isISODate(null)).toBe(false);
            expect(isISODate(undefined)).toBe(false);
            expect(isISODate('nicht-ein-datum')).toBe(false);
        });
    });

    describe('formatDate()', () => {
        test('sollte Date-Objekt in ISO-String umwandeln', () => {
            const date = new Date(2026, 0, 15); // Januar ist 0
            expect(formatDate(date)).toBe('2026-01-15');
        });

        test('sollte einstellige Monate mit führender Null formatieren', () => {
            const date = new Date(2026, 4, 5); // Mai (4) ist einstellig
            expect(formatDate(date)).toBe('2026-05-05');
        });

        test('sollte Dezember korrekt formatieren', () => {
            const date = new Date(2026, 11, 25); // Dezember ist 11
            expect(formatDate(date)).toBe('2026-12-25');
        });
    });
});

describe('Dateigröße Formatierung (fmtBytes)', () => {
    test('sollte 0 B für 0 oder ungültige Werte zurückgeben', () => {
        expect(fmtBytes(0)).toBe('0 B');
        expect(fmtBytes(null)).toBe('0 B');
        expect(fmtBytes(undefined)).toBe('0 B');
        expect(fmtBytes('')).toBe('0 B');
    });

    test('sollte Bytes korrekt formatieren', () => {
        expect(fmtBytes(100)).toBe('100 B');
        expect(fmtBytes(512)).toBe('512 B');
    });

    test('sollte Kilobytes korrekt formatieren', () => {
        expect(fmtBytes(1024)).toBe('1.0 KB');
        expect(fmtBytes(2048)).toBe('2.0 KB');
        expect(fmtBytes(1536)).toBe('1.5 KB');
    });

    test('sollte Megabytes korrekt formatieren', () => {
        expect(fmtBytes(1048576)).toBe('1.0 MB');
        expect(fmtBytes(5242880)).toBe('5.0 MB');
    });

    test('sollte Gigabytes korrekt formatieren', () => {
        expect(fmtBytes(1073741824)).toBe('1.0 GB');
    });

    test('sollte große KB-Werte ohne Dezimalstellen anzeigen', () => {
        expect(fmtBytes(10240)).toBe('10 KB');
        expect(fmtBytes(102400)).toBe('100 KB');
    });
});

describe('HTML Escaping (escapeHtml)', () => {
    test('sollte & zu &amp; escapen', () => {
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('sollte < zu &lt; escapen', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    test('sollte > zu &gt; escapen', () => {
        expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    test('sollte " zu &quot; escapen', () => {
        expect(escapeHtml('Er sagte "Hallo"')).toBe('Er sagte &quot;Hallo&quot;');
    });

    test('sollte mehrere Sonderzeichen gleichzeitig escapen', () => {
        expect(escapeHtml('<div class="test">&</div>'))
            .toBe('&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;');
    });

    test('sollte leeren String für null/undefined zurückgeben', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });

    test('sollte normalen Text unverändert lassen', () => {
        expect(escapeHtml('Normaler Text')).toBe('Normaler Text');
    });
});
