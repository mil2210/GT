/**
 * Jest Tests für das Kalender-Modul
 * 
 * Tests für Event-Verwaltung und Datumsberechnungen
 */

// Hilfsfunktionen aus kalender.js nachgebildet
function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Event-Filterung für anstehende Events
function filterUpcomingEvents(events, now = new Date()) {
    return events
        .filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Berechne Tage bis zum Event
function getDaysDiff(eventDate, now = new Date()) {
    const date = new Date(eventDate);
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.ceil((eventStart - nowStart) / (1000 * 60 * 60 * 24));
}

// Generiere Zeitinfo-Text
function getTimeInfo(eventDate, now = new Date()) {
    const daysDiff = getDaysDiff(eventDate, now);
    if (daysDiff === 0) return 'Heute';
    if (daysDiff === 1) return 'Morgen';
    if (daysDiff < 0) return `vor ${Math.abs(daysDiff)} Tagen`;
    return `in ${daysDiff} Tagen`;
}

// Kalender-Rendering Hilfsfunktionen
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1);
}

function getLastDayOfMonth(year, month) {
    return new Date(year, month + 1, 0);
}

function getMonthStartDay(year, month) {
    const first = getFirstDayOfMonth(year, month);
    return (first.getDay() + 6) % 7; // Montag = 0
}

// Event-Validierung
function validateEvent(event) {
    const errors = [];
    
    if (!event.id) errors.push('ID fehlt');
    if (!event.date) errors.push('Datum fehlt');
    if (!event.title || event.title.trim() === '') errors.push('Titel fehlt');
    
    if (event.date && !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
        errors.push('Ungültiges Datumsformat');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

describe('Kalender Hilfsfunktionen', () => {
    describe('formatDate()', () => {
        test('sollte Datum korrekt formatieren', () => {
            expect(formatDate(new Date(2026, 0, 15))).toBe('2026-01-15');
            expect(formatDate(new Date(2026, 11, 25))).toBe('2026-12-25');
        });

        test('sollte einstellige Tage mit führender Null formatieren', () => {
            expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
        });

        test('sollte einstellige Monate mit führender Null formatieren', () => {
            expect(formatDate(new Date(2026, 2, 15))).toBe('2026-03-15');
        });
    });

    describe('escapeHtml()', () => {
        test('sollte HTML-Zeichen escapen', () => {
            expect(escapeHtml('<Termin>')).toBe('&lt;Termin&gt;');
            expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        test('sollte null/undefined behandeln', () => {
            expect(escapeHtml(null)).toBe('');
            expect(escapeHtml(undefined)).toBe('');
        });
    });
});

describe('Event-Filterung', () => {
    const testEvents = [
        { id: 1, date: '2026-01-10', title: 'Vergangenes Event' },
        { id: 2, date: '2026-01-15', title: 'Heutiges Event' },
        { id: 3, date: '2026-01-20', title: 'Zukünftiges Event 1' },
        { id: 4, date: '2026-01-25', title: 'Zukünftiges Event 2' },
        { id: 5, date: '2026-02-01', title: 'Zukünftiges Event 3' }
    ];

    const referenceDate = new Date(2026, 0, 15); // 15. Januar 2026

    test('sollte nur zukünftige Events zurückgeben', () => {
        const upcoming = filterUpcomingEvents(testEvents, referenceDate);
        
        expect(upcoming.length).toBe(4); // Heute + 3 zukünftige
        expect(upcoming[0].id).toBe(2); // Heutiges Event zuerst
    });

    test('sollte Events nach Datum sortieren', () => {
        const unsorted = [
            { id: 1, date: '2026-01-25', title: 'Später' },
            { id: 2, date: '2026-01-20', title: 'Früher' }
        ];
        
        const sorted = filterUpcomingEvents(unsorted, referenceDate);
        
        expect(sorted[0].date).toBe('2026-01-20');
        expect(sorted[1].date).toBe('2026-01-25');
    });

    test('sollte leeres Array bei keinen zukünftigen Events zurückgeben', () => {
        const pastEvents = [
            { id: 1, date: '2026-01-01', title: 'Vergangen' }
        ];
        
        const upcoming = filterUpcomingEvents(pastEvents, referenceDate);
        
        expect(upcoming.length).toBe(0);
    });
});

describe('Tages-Differenz Berechnung', () => {
    const referenceDate = new Date(2026, 0, 15); // 15. Januar 2026

    test('sollte 0 für heutiges Datum zurückgeben', () => {
        expect(getDaysDiff('2026-01-15', referenceDate)).toBe(0);
    });

    test('sollte 1 für morgen zurückgeben', () => {
        expect(getDaysDiff('2026-01-16', referenceDate)).toBe(1);
    });

    test('sollte negative Zahl für vergangene Daten zurückgeben', () => {
        expect(getDaysDiff('2026-01-14', referenceDate)).toBe(-1);
        expect(getDaysDiff('2026-01-10', referenceDate)).toBe(-5);
    });

    test('sollte korrekte Differenz für zukünftige Daten zurückgeben', () => {
        expect(getDaysDiff('2026-01-20', referenceDate)).toBe(5);
        expect(getDaysDiff('2026-02-15', referenceDate)).toBe(31);
    });
});

describe('Zeitinfo-Text', () => {
    const referenceDate = new Date(2026, 0, 15);

    test('sollte "Heute" für heutiges Datum zurückgeben', () => {
        expect(getTimeInfo('2026-01-15', referenceDate)).toBe('Heute');
    });

    test('sollte "Morgen" für morgiges Datum zurückgeben', () => {
        expect(getTimeInfo('2026-01-16', referenceDate)).toBe('Morgen');
    });

    test('sollte "in X Tagen" für zukünftige Daten zurückgeben', () => {
        expect(getTimeInfo('2026-01-20', referenceDate)).toBe('in 5 Tagen');
    });

    test('sollte "vor X Tagen" für vergangene Daten zurückgeben', () => {
        expect(getTimeInfo('2026-01-10', referenceDate)).toBe('vor 5 Tagen');
    });
});

describe('Kalender-Rendering', () => {
    describe('getFirstDayOfMonth()', () => {
        test('sollte ersten Tag des Monats zurückgeben', () => {
            const first = getFirstDayOfMonth(2026, 0); // Januar 2026
            expect(first.getDate()).toBe(1);
            expect(first.getMonth()).toBe(0);
            expect(first.getFullYear()).toBe(2026);
        });
    });

    describe('getLastDayOfMonth()', () => {
        test('sollte letzten Tag des Monats zurückgeben', () => {
            expect(getLastDayOfMonth(2026, 0).getDate()).toBe(31); // Januar
            expect(getLastDayOfMonth(2026, 1).getDate()).toBe(28); // Februar (kein Schaltjahr)
            expect(getLastDayOfMonth(2024, 1).getDate()).toBe(29); // Februar Schaltjahr
            expect(getLastDayOfMonth(2026, 3).getDate()).toBe(30); // April
        });
    });

    describe('getMonthStartDay()', () => {
        test('sollte korrekten Wochentag für Monatsstart zurückgeben (Mo=0)', () => {
            // 1. Januar 2026 ist ein Donnerstag
            expect(getMonthStartDay(2026, 0)).toBe(3); // Donnerstag = 3
            
            // 1. Februar 2026 ist ein Sonntag
            expect(getMonthStartDay(2026, 1)).toBe(6); // Sonntag = 6
        });
    });
});

describe('Event-Validierung', () => {
    test('sollte gültiges Event akzeptieren', () => {
        const event = {
            id: 'event-1',
            date: '2026-01-20',
            title: 'Arzttermin'
        };
        
        const result = validateEvent(event);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    test('sollte Event ohne ID ablehnen', () => {
        const event = {
            date: '2026-01-20',
            title: 'Arzttermin'
        };
        
        const result = validateEvent(event);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('ID fehlt');
    });

    test('sollte Event ohne Datum ablehnen', () => {
        const event = {
            id: 'event-1',
            title: 'Arzttermin'
        };
        
        const result = validateEvent(event);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Datum fehlt');
    });

    test('sollte Event ohne Titel ablehnen', () => {
        const event = {
            id: 'event-1',
            date: '2026-01-20'
        };
        
        const result = validateEvent(event);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Titel fehlt');
    });

    test('sollte Event mit leerem Titel ablehnen', () => {
        const event = {
            id: 'event-1',
            date: '2026-01-20',
            title: '   '
        };
        
        const result = validateEvent(event);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Titel fehlt');
    });

    test('sollte Event mit ungültigem Datumsformat ablehnen', () => {
        const event = {
            id: 'event-1',
            date: '20-01-2026', // Falsches Format
            title: 'Arzttermin'
        };
        
        const result = validateEvent(event);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Ungültiges Datumsformat');
    });

    test('sollte mehrere Fehler sammeln', () => {
        const event = {};
        
        const result = validateEvent(event);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
    });
});

describe('Event mit Tags', () => {
    const tagColors = {
        health: '#E74C3C',
        appointment: '#3498DB',
        reminder: '#F1C40F',
        personal: '#9B59B6'
    };

    function getTagColor(tag) {
        return tagColors[tag] || '#95A5A6';
    }

    test('sollte korrekte Farbe für bekannte Tags zurückgeben', () => {
        expect(getTagColor('health')).toBe('#E74C3C');
        expect(getTagColor('appointment')).toBe('#3498DB');
    });

    test('sollte Standardfarbe für unbekannte Tags zurückgeben', () => {
        expect(getTagColor('unknown')).toBe('#95A5A6');
        expect(getTagColor('')).toBe('#95A5A6');
    });
});
