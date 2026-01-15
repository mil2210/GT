/**
 * Jest Tests für die Authentifizierung (Auth-Modul)
 * 
 * Tests für Login, Registrierung und Token-Validierung
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = 'test-secret';

// SHA256 Hilfsfunktion
function sha256(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

// Simulierte Auth-Funktionen
function createToken(userId, email) {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

function validatePassword(password) {
    if (!password || password.length < 1) {
        return { valid: false, error: 'Passwort darf nicht leer sein' };
    }
    return { valid: true };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return { valid: false, error: 'Ungültige E-Mail-Adresse' };
    }
    return { valid: true };
}

function validateUsername(username) {
    if (!username || username.trim().length === 0) {
        return { valid: false, error: 'Benutzername darf nicht leer sein' };
    }
    return { valid: true };
}

describe('Token-Verwaltung', () => {
    describe('createToken()', () => {
        test('sollte gültigen JWT-Token erstellen', () => {
            const token = createToken(1, 'test@test.de');
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // JWT hat 3 Teile
        });

        test('sollte Token mit korrekten Daten erstellen', () => {
            const token = createToken(123, 'user@example.de');
            const decoded = jwt.decode(token);
            
            expect(decoded.userId).toBe(123);
            expect(decoded.email).toBe('user@example.de');
        });

        test('sollte Token mit Ablaufdatum erstellen', () => {
            const token = createToken(1, 'test@test.de');
            const decoded = jwt.decode(token);
            
            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();
        });
    });

    describe('verifyToken()', () => {
        test('sollte gültigen Token verifizieren', () => {
            const token = createToken(1, 'test@test.de');
            const result = verifyToken(token);
            
            expect(result).not.toBeNull();
            expect(result.userId).toBe(1);
            expect(result.email).toBe('test@test.de');
        });

        test('sollte null für ungültigen Token zurückgeben', () => {
            const result = verifyToken('invalid.token.here');
            expect(result).toBeNull();
        });

        test('sollte null für manipulierten Token zurückgeben', () => {
            const token = createToken(1, 'test@test.de');
            const manipulated = token.slice(0, -5) + 'XXXXX';
            
            const result = verifyToken(manipulated);
            expect(result).toBeNull();
        });

        test('sollte null für leeren Token zurückgeben', () => {
            expect(verifyToken('')).toBeNull();
            expect(verifyToken(null)).toBeNull();
        });
    });
});

describe('Passwort-Hashing', () => {
    test('sollte Passwort korrekt hashen', () => {
        const password = 'meinPasswort123';
        const hash = sha256(password);
        
        expect(hash).toBeDefined();
        expect(hash.length).toBe(64);
    });

    test('sollte verschiedene Passwörter unterschiedlich hashen', () => {
        const hash1 = sha256('passwort1');
        const hash2 = sha256('passwort2');
        
        expect(hash1).not.toBe(hash2);
    });

    test('sollte gleiches Passwort gleich hashen', () => {
        const password = 'testPasswort';
        const hash1 = sha256(password);
        const hash2 = sha256(password);
        
        expect(hash1).toBe(hash2);
    });
});

describe('Eingabe-Validierung', () => {
    describe('validatePassword()', () => {
        test('sollte gültiges Passwort akzeptieren', () => {
            const result = validatePassword('sicheresPasswort123');
            expect(result.valid).toBe(true);
        });

        test('sollte leeres Passwort ablehnen', () => {
            expect(validatePassword('').valid).toBe(false);
            expect(validatePassword(null).valid).toBe(false);
            expect(validatePassword(undefined).valid).toBe(false);
        });
    });

    describe('validateEmail()', () => {
        test('sollte gültige E-Mail akzeptieren', () => {
            expect(validateEmail('test@example.de').valid).toBe(true);
            expect(validateEmail('user.name@domain.com').valid).toBe(true);
            expect(validateEmail('user+tag@example.org').valid).toBe(true);
        });

        test('sollte ungültige E-Mail ablehnen', () => {
            expect(validateEmail('').valid).toBe(false);
            expect(validateEmail('ungueltig').valid).toBe(false);
            expect(validateEmail('ohne@domain').valid).toBe(false);
            expect(validateEmail('@example.de').valid).toBe(false);
            expect(validateEmail('test@').valid).toBe(false);
        });
    });

    describe('validateUsername()', () => {
        test('sollte gültigen Benutzernamen akzeptieren', () => {
            expect(validateUsername('MaxMustermann').valid).toBe(true);
            expect(validateUsername('user123').valid).toBe(true);
        });

        test('sollte leeren Benutzernamen ablehnen', () => {
            expect(validateUsername('').valid).toBe(false);
            expect(validateUsername('   ').valid).toBe(false);
            expect(validateUsername(null).valid).toBe(false);
        });
    });
});

describe('Registrierungs-Workflow', () => {
    // Simulierte Registrierung
    function simulateRegister(username, email, password) {
        const usernameValid = validateUsername(username);
        if (!usernameValid.valid) return { success: false, error: usernameValid.error };

        const emailValid = validateEmail(email);
        if (!emailValid.valid) return { success: false, error: emailValid.error };

        const passwordValid = validatePassword(password);
        if (!passwordValid.valid) return { success: false, error: passwordValid.error };

        return { 
            success: true, 
            userId: 1,
            passwordHash: sha256(password)
        };
    }

    test('sollte Benutzer erfolgreich registrieren', () => {
        const result = simulateRegister('TestUser', 'test@test.de', 'password123');
        
        expect(result.success).toBe(true);
        expect(result.userId).toBeDefined();
        expect(result.passwordHash).toBeDefined();
    });

    test('sollte bei ungültigem Benutzernamen fehlschlagen', () => {
        const result = simulateRegister('', 'test@test.de', 'password123');
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test('sollte bei ungültiger E-Mail fehlschlagen', () => {
        const result = simulateRegister('TestUser', 'ungueltig', 'password123');
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test('sollte bei fehlendem Passwort fehlschlagen', () => {
        const result = simulateRegister('TestUser', 'test@test.de', '');
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});

describe('Login-Workflow', () => {
    // Simulierter Login
    function simulateLogin(storedHash, inputPassword) {
        const inputHash = sha256(inputPassword);
        
        if (inputHash === storedHash) {
            return {
                success: true,
                token: createToken(1, 'test@test.de')
            };
        }
        
        return { success: false, error: 'Ungültige Anmeldedaten' };
    }

    test('sollte bei korrektem Passwort erfolgreich einloggen', () => {
        const storedHash = sha256('meinPasswort');
        const result = simulateLogin(storedHash, 'meinPasswort');
        
        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
    });

    test('sollte bei falschem Passwort fehlschlagen', () => {
        const storedHash = sha256('meinPasswort');
        const result = simulateLogin(storedHash, 'falschesPasswort');
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
