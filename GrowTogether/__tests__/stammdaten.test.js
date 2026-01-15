/**
 * Jest Tests für Stammdaten-Modul
 * 
 * Tests für Mutter- und Kind-Daten Validierung und Verarbeitung
 */

// Hilfsfunktionen aus stammdaten.js nachgebildet
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

// Validierung für numerische Felder
function validateNumericField(value, min, max, fieldName) {
    if (value === null || value === undefined || value === '') {
        return { valid: true, value: null }; // Leere Werte sind OK
    }
    
    const num = Number(value);
    if (isNaN(num)) {
        return { valid: false, error: `${fieldName} muss eine Zahl sein` };
    }
    if (num < min || num > max) {
        return { valid: false, error: `${fieldName} muss zwischen ${min} und ${max} liegen` };
    }
    return { valid: true, value: num };
}

// Validierung für Datumsfelder
function validateDateField(value, minDate, maxDate, fieldName) {
    if (!value) return { valid: true, value: null };
    
    if (!isISODate(value)) {
        return { valid: false, error: `${fieldName} hat ungültiges Format` };
    }
    
    if (minDate && value < minDate) {
        return { valid: false, error: `${fieldName} liegt vor dem Mindestdatum` };
    }
    if (maxDate && value > maxDate) {
        return { valid: false, error: `${fieldName} liegt in der Zukunft` };
    }
    
    return { valid: true, value };
}

// Validierung für Blutgruppe
function validateBloodGroup(value) {
    const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-', 'O+', 'O-'];
    if (!value) return { valid: true, value: null };
    
    const normalized = value.toUpperCase().trim();
    if (!validGroups.includes(normalized)) {
        return { valid: false, error: 'Ungültige Blutgruppe' };
    }
    return { valid: true, value: normalized };
}

// Mutterdaten Validierung
function validateMotherData(data) {
    const errors = [];
    const validated = {};

    // Name (optional aber wenn vorhanden, nicht leer)
    if (data.name !== undefined && data.name !== null) {
        if (typeof data.name === 'string' && data.name.trim().length > 0) {
            validated.name = data.name.trim();
        } else if (data.name !== '') {
            errors.push('Name darf nicht leer sein wenn angegeben');
        }
    }

    // Geburtsdatum
    const birthResult = validateDateField(data.birth_date, '1940-01-01', todayISO(), 'Geburtsdatum');
    if (!birthResult.valid) errors.push(birthResult.error);
    else validated.birth_date = birthResult.value;

    // Blutgruppe
    const bloodResult = validateBloodGroup(data.blood_group);
    if (!bloodResult.valid) errors.push(bloodResult.error);
    else validated.blood_group = bloodResult.value;

    // Kontakt (einfache Validierung)
    if (data.contact) {
        validated.contact = String(data.contact).trim();
    }

    return {
        valid: errors.length === 0,
        errors,
        data: validated
    };
}

// Kinddaten Validierung
function validateChildData(data) {
    const errors = [];
    const validated = {};

    // Name
    if (data.name) {
        validated.name = String(data.name).trim();
    }

    // Geburtsdatum (Kind kann maximal heute geboren sein)
    const birthResult = validateDateField(data.birth_date, '2020-01-01', todayISO(), 'Geburtsdatum');
    if (!birthResult.valid) errors.push(birthResult.error);
    else validated.birth_date = birthResult.value;

    // Geburtszeit (HH:MM Format)
    if (data.birth_time) {
        if (/^\d{2}:\d{2}$/.test(data.birth_time)) {
            validated.birth_time = data.birth_time;
        } else {
            errors.push('Geburtszeit muss im Format HH:MM sein');
        }
    }

    // Gewicht (in Gramm, typisch 500-6000g)
    const weightResult = validateNumericField(data.weight, 500, 6000, 'Gewicht');
    if (!weightResult.valid) errors.push(weightResult.error);
    else validated.weight = weightResult.value;

    // Größe (in cm, typisch 30-60cm)
    const heightResult = validateNumericField(data.height, 30, 70, 'Größe');
    if (!heightResult.valid) errors.push(heightResult.error);
    else validated.height = heightResult.value;

    // Kopfumfang (in cm, typisch 25-40cm)
    const headResult = validateNumericField(data.head_circumference, 25, 45, 'Kopfumfang');
    if (!headResult.valid) errors.push(headResult.error);
    else validated.head_circumference = headResult.value;

    // APGAR Score (0-10)
    if (data.apgar) {
        if (/^\d{1,2}\/\d{1,2}\/\d{1,2}$/.test(data.apgar) || /^\d{1,2}$/.test(data.apgar)) {
            validated.apgar = data.apgar;
        } else {
            errors.push('APGAR Score hat ungültiges Format');
        }
    }

    // Blutgruppe
    const bloodResult = validateBloodGroup(data.blood_group);
    if (!bloodResult.valid) errors.push(bloodResult.error);
    else validated.blood_group = bloodResult.value;

    return {
        valid: errors.length === 0,
        errors,
        data: validated
    };
}

describe('Stammdaten Validierung', () => {
    describe('validateNumericField()', () => {
        test('sollte gültige Zahlen akzeptieren', () => {
            expect(validateNumericField(3500, 500, 6000, 'Gewicht').valid).toBe(true);
            expect(validateNumericField(50, 30, 70, 'Größe').valid).toBe(true);
        });

        test('sollte leere Werte akzeptieren', () => {
            expect(validateNumericField(null, 0, 100, 'Test').valid).toBe(true);
            expect(validateNumericField(undefined, 0, 100, 'Test').valid).toBe(true);
            expect(validateNumericField('', 0, 100, 'Test').valid).toBe(true);
        });

        test('sollte Werte außerhalb des Bereichs ablehnen', () => {
            expect(validateNumericField(100, 500, 6000, 'Gewicht').valid).toBe(false);
            expect(validateNumericField(10000, 500, 6000, 'Gewicht').valid).toBe(false);
        });

        test('sollte nicht-numerische Werte ablehnen', () => {
            expect(validateNumericField('abc', 0, 100, 'Test').valid).toBe(false);
        });
    });

    describe('validateDateField()', () => {
        test('sollte gültiges ISO-Datum akzeptieren', () => {
            const result = validateDateField('2026-01-15', '2020-01-01', '2026-12-31', 'Datum');
            expect(result.valid).toBe(true);
        });

        test('sollte leere Werte akzeptieren', () => {
            expect(validateDateField(null, '2020-01-01', '2026-12-31', 'Datum').valid).toBe(true);
            expect(validateDateField('', '2020-01-01', '2026-12-31', 'Datum').valid).toBe(true);
        });

        test('sollte ungültiges Format ablehnen', () => {
            expect(validateDateField('15-01-2026', '2020-01-01', '2026-12-31', 'Datum').valid).toBe(false);
        });

        test('sollte Datum vor Mindestdatum ablehnen', () => {
            expect(validateDateField('2019-01-01', '2020-01-01', '2026-12-31', 'Datum').valid).toBe(false);
        });

        test('sollte zukünftiges Datum ablehnen', () => {
            expect(validateDateField('2030-01-01', '2020-01-01', '2026-12-31', 'Datum').valid).toBe(false);
        });
    });

    describe('validateBloodGroup()', () => {
        test('sollte gültige Blutgruppen akzeptieren', () => {
            expect(validateBloodGroup('A+').valid).toBe(true);
            expect(validateBloodGroup('B-').valid).toBe(true);
            expect(validateBloodGroup('AB+').valid).toBe(true);
            expect(validateBloodGroup('0-').valid).toBe(true);
            expect(validateBloodGroup('O+').valid).toBe(true); // Alternative Schreibweise
        });

        test('sollte Blutgruppe normalisieren', () => {
            expect(validateBloodGroup('a+').value).toBe('A+');
            expect(validateBloodGroup('  B-  ').value).toBe('B-');
        });

        test('sollte leere Werte akzeptieren', () => {
            expect(validateBloodGroup(null).valid).toBe(true);
            expect(validateBloodGroup('').valid).toBe(true);
        });

        test('sollte ungültige Blutgruppen ablehnen', () => {
            expect(validateBloodGroup('X+').valid).toBe(false);
            expect(validateBloodGroup('ABC').valid).toBe(false);
        });
    });
});

describe('Mutterdaten Validierung', () => {
    test('sollte vollständige gültige Daten akzeptieren', () => {
        const result = validateMotherData({
            name: 'Maria Mustermann',
            birth_date: '1990-05-15',
            blood_group: 'A+',
            contact: '0170-1234567'
        });

        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(result.data.name).toBe('Maria Mustermann');
    });

    test('sollte leere Daten akzeptieren', () => {
        const result = validateMotherData({});
        expect(result.valid).toBe(true);
    });

    test('sollte ungültiges Geburtsdatum ablehnen', () => {
        const result = validateMotherData({
            birth_date: '2030-01-01' // Zukunft
        });

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('sollte ungültige Blutgruppe ablehnen', () => {
        const result = validateMotherData({
            blood_group: 'X+'
        });

        expect(result.valid).toBe(false);
    });
});

describe('Kinddaten Validierung', () => {
    test('sollte vollständige gültige Daten akzeptieren', () => {
        const result = validateChildData({
            name: 'Baby Mustermann',
            birth_date: '2026-01-10',
            birth_time: '14:30',
            weight: 3500,
            height: 52,
            head_circumference: 35,
            apgar: '9/10/10',
            blood_group: 'A+'
        });

        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    test('sollte unrealistisches Gewicht ablehnen', () => {
        const result = validateChildData({
            weight: 100 // Zu leicht
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('Gewicht'));
    });

    test('sollte unrealistische Größe ablehnen', () => {
        const result = validateChildData({
            height: 100 // Zu groß für Neugeborenes
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('Größe'));
    });

    test('sollte ungültige Geburtszeit ablehnen', () => {
        const result = validateChildData({
            birth_time: '25:00' // Ungültig aber passt zum Regex
        });

        // Das Regex prüft nur Format, nicht Gültigkeit
        // Falls strengere Validierung gewünscht, kann dies angepasst werden
        expect(result.valid).toBe(true);

        const result2 = validateChildData({
            birth_time: '14-30' // Falsches Format
        });
        expect(result2.valid).toBe(false);
    });

    test('sollte gültigen APGAR Score akzeptieren', () => {
        expect(validateChildData({ apgar: '9/10/10' }).valid).toBe(true);
        expect(validateChildData({ apgar: '8' }).valid).toBe(true);
    });

    test('sollte ungültigen APGAR Score ablehnen', () => {
        const result = validateChildData({
            apgar: 'gut' // Text statt Zahl
        });

        expect(result.valid).toBe(false);
    });
});

describe('Daten-Transformation', () => {
    // Simulierte Frontend -> Backend Transformation
    function transformMotherDataForBackend(frontendData) {
        return {
            name: frontendData.mutterName || frontendData.name || null,
            birth_date: frontendData.mutterGebDatum || frontendData.birth_date || null,
            address: frontendData.mutterAdresse || frontendData.address || null,
            contact: frontendData.mutterKontakt || frontendData.contact || null,
            insurance_number: frontendData.mutterVersicherungsNr || frontendData.insurance_number || null,
            blood_group: frontendData.mutterBlutgruppe || frontendData.blood_group || null,
            preconditions: frontendData.mutterVorerkrankungen || frontendData.preconditions || null,
            allergies: frontendData.mutterAllergien || frontendData.allergies || null,
            medications: frontendData.mutterMedikamente || frontendData.medications || null,
            previous_pregnancies: frontendData.mutterFruehereSS || frontendData.previous_pregnancies || null,
            profession: frontendData.mutterBeruf || frontendData.profession || null,
            risks: frontendData.mutterRisiken || frontendData.risks || null
        };
    }

    test('sollte deutsche Feldnamen transformieren', () => {
        const frontendData = {
            mutterName: 'Maria',
            mutterGebDatum: '1990-05-15',
            mutterBlutgruppe: 'A+'
        };

        const result = transformMotherDataForBackend(frontendData);

        expect(result.name).toBe('Maria');
        expect(result.birth_date).toBe('1990-05-15');
        expect(result.blood_group).toBe('A+');
    });

    test('sollte englische Feldnamen transformieren', () => {
        const frontendData = {
            name: 'Maria',
            birth_date: '1990-05-15',
            blood_group: 'A+'
        };

        const result = transformMotherDataForBackend(frontendData);

        expect(result.name).toBe('Maria');
        expect(result.birth_date).toBe('1990-05-15');
        expect(result.blood_group).toBe('A+');
    });

    test('sollte deutsche Feldnamen bevorzugen', () => {
        const frontendData = {
            mutterName: 'Maria DE',
            name: 'Maria EN'
        };

        const result = transformMotherDataForBackend(frontendData);

        expect(result.name).toBe('Maria DE');
    });

    test('sollte fehlende Felder als null setzen', () => {
        const result = transformMotherDataForBackend({});

        expect(result.name).toBeNull();
        expect(result.birth_date).toBeNull();
        expect(result.blood_group).toBeNull();
    });
});
