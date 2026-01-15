/**
 * Jest Tests für Dokumente-Modul
 * 
 * Tests für Datei-Upload, Validierung und Verwaltung
 */

// Hilfsfunktionen aus dokumente.js nachgebildet
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

// Erlaubte Dateitypen
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx'];

// Maximale Dateigröße (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Datei-Validierung
function validateFile(file) {
    const errors = [];

    if (!file || !file.name) {
        return { valid: false, errors: ['Keine Datei ausgewählt'] };
    }

    // Dateigröße prüfen
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`Datei zu groß (max. ${fmtBytes(MAX_FILE_SIZE)})`);
    }

    // Dateiendung prüfen
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        errors.push(`Dateityp nicht erlaubt (erlaubt: ${ALLOWED_EXTENSIONS.join(', ')})`);
    }

    // MIME-Type prüfen (wenn verfügbar)
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
        errors.push('Ungültiger Dateityp');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// Dateiname bereinigen
function sanitizeFilename(filename) {
    if (!filename) return 'unnamed_file';
    
    // Gefährliche Zeichen entfernen
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 255); // Max Länge
}

// Dokument-Objekt erstellen
function createDocumentObject(file, userId) {
    return {
        user_id: userId,
        filename: sanitizeFilename(file.name),
        filesize: file.size || 0,
        mimetype: file.type || 'application/octet-stream',
        upload_date: new Date().toISOString(),
        filepath: `/uploads/${userId}/${Date.now()}_${sanitizeFilename(file.name)}`
    };
}

// Sortierung
function sortDocuments(docs, sortBy = 'date', order = 'desc') {
    return [...docs].sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
            case 'name':
                comparison = (a.name || '').localeCompare(b.name || '');
                break;
            case 'size':
                comparison = (a.size_bytes || 0) - (b.size_bytes || 0);
                break;
            case 'date':
            default:
                comparison = new Date(a.created_date || 0) - new Date(b.created_date || 0);
        }
        
        return order === 'desc' ? -comparison : comparison;
    });
}

// Filterung
function filterDocuments(docs, searchTerm) {
    if (!searchTerm) return docs;
    
    const term = searchTerm.toLowerCase();
    return docs.filter(doc => 
        (doc.name || '').toLowerCase().includes(term)
    );
}

describe('Dateigröße Formatierung', () => {
    test('sollte 0 B für ungültige Werte zurückgeben', () => {
        expect(fmtBytes(0)).toBe('0 B');
        expect(fmtBytes(null)).toBe('0 B');
        expect(fmtBytes(undefined)).toBe('0 B');
        // Negative Werte werden als Zahl behandelt
    });

    test('sollte Bytes korrekt formatieren', () => {
        expect(fmtBytes(1)).toBe('1 B');
        expect(fmtBytes(100)).toBe('100 B');
        expect(fmtBytes(1023)).toBe('1023 B');
    });

    test('sollte Kilobytes korrekt formatieren', () => {
        expect(fmtBytes(1024)).toBe('1.0 KB');
        expect(fmtBytes(1536)).toBe('1.5 KB');
        expect(fmtBytes(10240)).toBe('10 KB');
    });

    test('sollte Megabytes korrekt formatieren', () => {
        expect(fmtBytes(1048576)).toBe('1.0 MB');
        expect(fmtBytes(5242880)).toBe('5.0 MB');
        expect(fmtBytes(10485760)).toBe('10 MB');
    });

    test('sollte Gigabytes korrekt formatieren', () => {
        expect(fmtBytes(1073741824)).toBe('1.0 GB');
        expect(fmtBytes(5368709120)).toBe('5.0 GB');
    });
});

describe('HTML Escaping', () => {
    test('sollte Sonderzeichen escapen', () => {
        expect(escapeHtml('<script>alert("XSS")</script>'))
            .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    test('sollte & korrekt escapen', () => {
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('sollte normalen Text unverändert lassen', () => {
        expect(escapeHtml('Normaler Text')).toBe('Normaler Text');
    });

    test('sollte null/undefined behandeln', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });
});

describe('Datei-Validierung', () => {
    test('sollte gültige PDF akzeptieren', () => {
        const file = {
            name: 'dokument.pdf',
            size: 1024 * 1024, // 1 MB
            type: 'application/pdf'
        };

        const result = validateFile(file);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    test('sollte gültige Bilder akzeptieren', () => {
        const jpgFile = { name: 'bild.jpg', size: 500000, type: 'image/jpeg' };
        const pngFile = { name: 'bild.png', size: 500000, type: 'image/png' };

        expect(validateFile(jpgFile).valid).toBe(true);
        expect(validateFile(pngFile).valid).toBe(true);
    });

    test('sollte zu große Dateien ablehnen', () => {
        const file = {
            name: 'gross.pdf',
            size: 20 * 1024 * 1024, // 20 MB
            type: 'application/pdf'
        };

        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('groß'))).toBe(true);
    });

    test('sollte nicht erlaubte Dateitypen ablehnen', () => {
        const file = {
            name: 'virus.exe',
            size: 1024,
            type: 'application/x-msdownload'
        };

        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Dateityp'))).toBe(true);
    });

    test('sollte fehlende Datei ablehnen', () => {
        expect(validateFile(null).valid).toBe(false);
        expect(validateFile({}).valid).toBe(false);
    });

    test('sollte ZIP-Dateien ablehnen', () => {
        const file = {
            name: 'archiv.zip',
            size: 1024,
            type: 'application/zip'
        };

        const result = validateFile(file);
        expect(result.valid).toBe(false);
    });
});

describe('Dateiname Bereinigung', () => {
    test('sollte gefährliche Zeichen ersetzen', () => {
        // Die Funktion ersetzt gefährliche Zeichen und reduziert dann mehrfache Unterstriche
        expect(sanitizeFilename('file<>:"/\\|?*.pdf')).toBe('file_.pdf');
    });

    test('sollte Leerzeichen durch Unterstriche ersetzen', () => {
        expect(sanitizeFilename('mein dokument.pdf')).toBe('mein_dokument.pdf');
    });

    test('sollte mehrfache Unterstriche reduzieren', () => {
        expect(sanitizeFilename('test___file.pdf')).toBe('test_file.pdf');
    });

    test('sollte leeren Namen behandeln', () => {
        expect(sanitizeFilename('')).toBe('unnamed_file');
        expect(sanitizeFilename(null)).toBe('unnamed_file');
    });

    test('sollte lange Namen kürzen', () => {
        const longName = 'a'.repeat(300) + '.pdf';
        const result = sanitizeFilename(longName);
        expect(result.length).toBeLessThanOrEqual(255);
    });
});

describe('Dokument-Objekt Erstellung', () => {
    test('sollte vollständiges Dokument-Objekt erstellen', () => {
        const file = {
            name: 'test.pdf',
            size: 1024,
            type: 'application/pdf'
        };

        const doc = createDocumentObject(file, 1);

        expect(doc.user_id).toBe(1);
        expect(doc.filename).toBe('test.pdf');
        expect(doc.filesize).toBe(1024);
        expect(doc.mimetype).toBe('application/pdf');
        expect(doc.upload_date).toBeDefined();
        expect(doc.filepath).toContain('/uploads/1/');
    });

    test('sollte Standard-MIME-Type setzen wenn nicht vorhanden', () => {
        const file = { name: 'test.dat', size: 100 };
        const doc = createDocumentObject(file, 1);

        expect(doc.mimetype).toBe('application/octet-stream');
    });
});

describe('Dokument-Sortierung', () => {
    const testDocs = [
        { name: 'B_doc.pdf', size_bytes: 1000, created_date: '2026-01-10' },
        { name: 'A_doc.pdf', size_bytes: 3000, created_date: '2026-01-15' },
        { name: 'C_doc.pdf', size_bytes: 2000, created_date: '2026-01-05' }
    ];

    test('sollte nach Datum absteigend sortieren (Standard)', () => {
        const sorted = sortDocuments(testDocs);
        expect(sorted[0].name).toBe('A_doc.pdf'); // Neuestes zuerst
        expect(sorted[2].name).toBe('C_doc.pdf'); // Ältestes zuletzt
    });

    test('sollte nach Datum aufsteigend sortieren', () => {
        const sorted = sortDocuments(testDocs, 'date', 'asc');
        expect(sorted[0].name).toBe('C_doc.pdf'); // Ältestes zuerst
    });

    test('sollte nach Name sortieren', () => {
        const sorted = sortDocuments(testDocs, 'name', 'asc');
        expect(sorted[0].name).toBe('A_doc.pdf');
        expect(sorted[2].name).toBe('C_doc.pdf');
    });

    test('sollte nach Größe sortieren', () => {
        const sorted = sortDocuments(testDocs, 'size', 'desc');
        expect(sorted[0].size_bytes).toBe(3000);
        expect(sorted[2].size_bytes).toBe(1000);
    });
});

describe('Dokument-Filterung', () => {
    const testDocs = [
        { name: 'Mutterpass.pdf' },
        { name: 'Ultraschall_01.jpg' },
        { name: 'Ultraschall_02.jpg' },
        { name: 'Impfpass.pdf' }
    ];

    test('sollte nach Suchbegriff filtern', () => {
        const filtered = filterDocuments(testDocs, 'Ultraschall');
        expect(filtered.length).toBe(2);
    });

    test('sollte case-insensitive filtern', () => {
        const filtered = filterDocuments(testDocs, 'ultraschall');
        expect(filtered.length).toBe(2);
    });

    test('sollte alle Dokumente bei leerem Suchbegriff zurückgeben', () => {
        const filtered = filterDocuments(testDocs, '');
        expect(filtered.length).toBe(4);
    });

    test('sollte leere Liste bei keinem Treffer zurückgeben', () => {
        const filtered = filterDocuments(testDocs, 'xyz');
        expect(filtered.length).toBe(0);
    });

    test('sollte nach Dateierweiterung filtern', () => {
        const filtered = filterDocuments(testDocs, '.pdf');
        expect(filtered.length).toBe(2);
    });
});

describe('Mehrere Dateien hochladen', () => {
    test('sollte mehrere gültige Dateien akzeptieren', () => {
        const files = [
            { name: 'doc1.pdf', size: 1000, type: 'application/pdf' },
            { name: 'doc2.jpg', size: 2000, type: 'image/jpeg' }
        ];

        const results = files.map(validateFile);
        expect(results.every(r => r.valid)).toBe(true);
    });

    test('sollte gemischte Ergebnisse bei teilweise ungültigen Dateien liefern', () => {
        const files = [
            { name: 'valid.pdf', size: 1000, type: 'application/pdf' },
            { name: 'invalid.exe', size: 1000, type: 'application/x-msdownload' }
        ];

        const results = files.map(validateFile);
        expect(results[0].valid).toBe(true);
        expect(results[1].valid).toBe(false);
    });
});

describe('Dokument-Löschung', () => {
    function canDeleteDocument(doc, userId) {
        // Nur der Besitzer kann ein Dokument löschen
        return doc.user_id === userId;
    }

    test('sollte Löschung für Besitzer erlauben', () => {
        const doc = { id: 1, user_id: 5, name: 'test.pdf' };
        expect(canDeleteDocument(doc, 5)).toBe(true);
    });

    test('sollte Löschung für andere Benutzer verbieten', () => {
        const doc = { id: 1, user_id: 5, name: 'test.pdf' };
        expect(canDeleteDocument(doc, 10)).toBe(false);
    });
});
