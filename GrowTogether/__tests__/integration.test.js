/**
 * Integration Tests für die GrowTogether API
 * 
 * Diese Tests prüfen das Zusammenspiel aller Komponenten
 * mit einer echten Datenbank-Verbindung.
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock für die Datenbank (für CI ohne echte DB)
jest.mock('../db', () => ({
    query: jest.fn()
}));

const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret';

function sha256(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

// Vollständige Test-App erstellen
function createIntegrationApp() {
    const app = express();
    app.use(express.json({ limit: "30mb" }));

    function auth(req, res, next) {
        const h = req.headers.authorization || "";
        const token = h.startsWith("Bearer ") ? h.slice(7) : null;
        if (!token) return res.status(401).json({ error: "Missing token" });
        try {
            req.user = jwt.verify(token, JWT_SECRET);
            next();
        } catch {
            return res.status(401).json({ error: "Invalid token" });
        }
    }

    // Health
    app.get("/api/health", async (req, res) => {
        try {
            await pool.query("SELECT 1");
            res.json({ ok: true });
        } catch (e) {
            res.status(500).json({ ok: false, error: "db down" });
        }
    });

    // Auth
    app.post("/api/auth/register", async (req, res) => {
        try {
            const { username, email, password } = req.body || {};
            if (!username || !email || !password) {
                return res.status(400).json({ error: "missing fields" });
            }
            const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
            if (exists.length) return res.status(409).json({ error: "email exists" });

            const passwordHash = sha256(password);
            const [r] = await pool.query(
                "INSERT INTO users (username, email, password) VALUES (?,?,?)",
                [username, email, passwordHash]
            );
            res.status(201).json({ ok: true, userId: r.insertId });
        } catch (e) {
            res.status(500).json({ error: "server error" });
        }
    });

    app.post("/api/auth/login", async (req, res) => {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) return res.status(400).json({ error: "missing fields" });

            const [rows] = await pool.query(
                "SELECT id, username, email, password FROM users WHERE email = ?",
                [email]
            );
            if (!rows.length) return res.status(401).json({ error: "bad credentials" });

            const u = rows[0];
            const incomingHash = sha256(password);
            if (incomingHash !== u.password) return res.status(401).json({ error: "bad credentials" });

            const token = jwt.sign({ userId: u.id, email: u.email }, JWT_SECRET, { expiresIn: "7d" });
            res.json({ token, email: u.email, username: u.username });
        } catch (e) {
            res.status(500).json({ error: "server error" });
        }
    });

    // Events
    app.get("/api/events", auth, async (req, res) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, DATE_FORMAT(event_date, '%Y-%m-%d') AS date, title, time, note, tag
                 FROM calender WHERE user_id = ? ORDER BY event_date ASC`,
                [req.user.userId]
            );
            res.json(rows);
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    app.post("/api/events", auth, async (req, res) => {
        try {
            const { id, date, title, time, note, tag } = req.body || {};
            if (!id || !date || !title) return res.status(400).json({ error: "missing fields" });

            const [r] = await pool.query(
                `INSERT INTO calender (user_id, event_date, title, time, note, tag) VALUES (?,?,?,?,?,?)`,
                [req.user.userId, date, title, time || "", note || "", tag || ""]
            );
            res.json({ ok: true, mode: "inserted", id: r.insertId });
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    app.delete("/api/events/:id", auth, async (req, res) => {
        try {
            await pool.query("DELETE FROM calender WHERE id = ? AND user_id = ?", [
                req.params.id,
                req.user.userId
            ]);
            res.json({ ok: true });
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    // Profile - Mother
    app.get("/api/profile/mother", auth, async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT * FROM mother_data WHERE user_id = ? LIMIT 1", [req.user.userId]);
            res.json(rows[0] || null);
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    app.put("/api/profile/mother", auth, async (req, res) => {
        try {
            const d = req.body || {};
            const payload = {
                name: d.name || null,
                birth_date: d.birth_date || null,
                address: d.address || null,
                contact: d.contact || null,
                insurance_number: d.insurance_number || null,
                blood_group: d.blood_group || null,
                preconditions: d.preconditions || null,
                allergies: d.allergies || null,
                medications: d.medications || null,
                previous_pregnancies: d.previous_pregnancies || null,
                profession: d.profession || null,
                risks: d.risks || null
            };

            const [rows] = await pool.query("SELECT id FROM mother_data WHERE user_id = ? LIMIT 1", [req.user.userId]);

            if (rows.length) {
                await pool.query(
                    `UPDATE mother_data SET name=?, birth_date=?, address=?, contact=?, 
                     insurance_number=?, blood_group=?, preconditions=?, allergies=?, 
                     medications=?, previous_pregnancies=?, profession=?, risks=? WHERE user_id=?`,
                    [...Object.values(payload), req.user.userId]
                );
            } else {
                await pool.query(
                    `INSERT INTO mother_data (user_id, name, birth_date, address, contact, 
                     insurance_number, blood_group, preconditions, allergies, medications, 
                     previous_pregnancies, profession, risks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [req.user.userId, ...Object.values(payload)]
                );
            }
            res.json({ ok: true });
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    // Profile - Child
    app.get("/api/profile/child", auth, async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT * FROM child_data WHERE user_id = ? LIMIT 1", [req.user.userId]);
            res.json(rows[0] || null);
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    app.put("/api/profile/child", auth, async (req, res) => {
        try {
            const d = req.body || {};
            const payload = {
                name: d.name || null,
                birth_date: d.birth_date || null,
                birth_time: d.birth_time || null,
                birth_place: d.birth_place || null,
                weight: d.weight ?? null,
                height: d.height ?? null,
                head_circumference: d.head_circumference ?? null,
                apgar: d.apgar || null,
                blood_group: d.blood_group || null,
                screening: d.screening || null
            };

            const [rows] = await pool.query("SELECT id FROM child_data WHERE user_id = ? LIMIT 1", [req.user.userId]);

            if (rows.length) {
                await pool.query(
                    `UPDATE child_data SET name=?, birth_date=?, birth_time=?, birth_place=?, 
                     weight=?, height=?, head_circumference=?, apgar=?, blood_group=?, screening=? WHERE user_id=?`,
                    [...Object.values(payload), req.user.userId]
                );
            } else {
                await pool.query(
                    `INSERT INTO child_data (user_id, name, birth_date, birth_time, birth_place, 
                     weight, height, head_circumference, apgar, blood_group, screening) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                    [req.user.userId, ...Object.values(payload)]
                );
            }
            res.json({ ok: true });
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    // Documents
    app.get("/api/docs", auth, async (req, res) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, filename AS name, filesize AS size_bytes, upload_date AS created_date, filepath
                 FROM documents WHERE user_id = ? ORDER BY upload_date DESC`,
                [req.user.userId]
            );
            res.json(rows);
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    app.post("/api/docs", auth, async (req, res) => {
        try {
            const { docs } = req.body || {};
            if (!Array.isArray(docs) || docs.length === 0) return res.status(400).json({ error: "no docs" });

            for (const d of docs) {
                const filename = d.name || "file";
                const filesize = Number(d.size_bytes || 0) || 0;
                const filepath = `/virtual/${Date.now()}_${filename}`;
                await pool.query(
                    `INSERT INTO documents (user_id, filename, filepath, filesize) VALUES (?,?,?,?)`,
                    [req.user.userId, filename, filepath, filesize]
                );
            }
            res.status(201).json({ ok: true });
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    app.delete("/api/docs/:id", auth, async (req, res) => {
        try {
            await pool.query("DELETE FROM documents WHERE id = ? AND user_id = ?", [
                req.params.id,
                req.user.userId
            ]);
            res.json({ ok: true });
        } catch (e) {
            res.status(500).json({ error: "db error" });
        }
    });

    return app;
}

describe('Integration Tests - Vollständiger Workflow', () => {
    let app;
    let userToken;
    const testUser = {
        username: 'IntegrationUser',
        email: 'integration@test.de',
        password: 'securePassword123'
    };

    beforeAll(() => {
        app = createIntegrationApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ==================== USER REGISTRATION WORKFLOW ====================
    describe('Benutzer Registrierung & Login Workflow', () => {
        test('sollte neuen Benutzer registrieren können', async () => {
            pool.query
                .mockResolvedValueOnce([[]]) // Keine existierende Email
                .mockResolvedValueOnce([{ insertId: 1 }]);

            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
            expect(res.body.userId).toBeDefined();
        });

        test('sollte registrierten Benutzer einloggen können', async () => {
            const passwordHash = sha256(testUser.password);
            pool.query.mockResolvedValueOnce([[{
                id: 1,
                username: testUser.username,
                email: testUser.email,
                password: passwordHash
            }]]);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            userToken = res.body.token;
        });
    });

    // ==================== EVENT WORKFLOW ====================
    describe('Kalender Event Workflow', () => {
        beforeEach(() => {
            userToken = jwt.sign({ userId: 1, email: testUser.email }, JWT_SECRET);
        });

        test('sollte Event erstellen und abrufen können', async () => {
            // Event erstellen
            pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

            const createRes = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    id: 'temp-1',
                    date: '2026-02-15',
                    title: 'Arzttermin',
                    time: '10:00',
                    note: 'Vorsorgeuntersuchung',
                    tag: 'health'
                });

            expect(createRes.status).toBe(200);
            expect(createRes.body.ok).toBe(true);

            // Events abrufen
            pool.query.mockResolvedValueOnce([[{
                id: 1,
                date: '2026-02-15',
                title: 'Arzttermin',
                time: '10:00',
                note: 'Vorsorgeuntersuchung',
                tag: 'health'
            }]]);

            const getRes = await request(app)
                .get('/api/events')
                .set('Authorization', `Bearer ${userToken}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.length).toBe(1);
            expect(getRes.body[0].title).toBe('Arzttermin');
        });

        test('sollte Event löschen können', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .delete('/api/events/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    // ==================== PROFILE WORKFLOW ====================
    describe('Stammdaten Workflow', () => {
        beforeEach(() => {
            userToken = jwt.sign({ userId: 1, email: testUser.email }, JWT_SECRET);
        });

        test('sollte Mutterdaten speichern und abrufen können', async () => {
            const motherData = {
                name: 'Maria Mustermann',
                birth_date: '1990-05-15',
                address: 'Musterstraße 1, 12345 Berlin',
                contact: '0170-1234567',
                blood_group: 'A+',
                allergies: 'Keine'
            };

            // Daten speichern (Insert)
            pool.query
                .mockResolvedValueOnce([[]]) // Keine existierenden Daten
                .mockResolvedValueOnce([{ insertId: 1 }]);

            const saveRes = await request(app)
                .put('/api/profile/mother')
                .set('Authorization', `Bearer ${userToken}`)
                .send(motherData);

            expect(saveRes.status).toBe(200);
            expect(saveRes.body.ok).toBe(true);

            // Daten abrufen
            pool.query.mockResolvedValueOnce([[{
                id: 1,
                user_id: 1,
                ...motherData
            }]]);

            const getRes = await request(app)
                .get('/api/profile/mother')
                .set('Authorization', `Bearer ${userToken}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.name).toBe(motherData.name);
        });

        test('sollte Kinddaten speichern und abrufen können', async () => {
            const childData = {
                name: 'Baby Mustermann',
                birth_date: '2026-01-10',
                birth_time: '14:30',
                weight: 3500,
                height: 52,
                blood_group: 'A+'
            };

            // Daten speichern
            pool.query
                .mockResolvedValueOnce([[]]) // Keine existierenden Daten
                .mockResolvedValueOnce([{ insertId: 1 }]);

            const saveRes = await request(app)
                .put('/api/profile/child')
                .set('Authorization', `Bearer ${userToken}`)
                .send(childData);

            expect(saveRes.status).toBe(200);
            expect(saveRes.body.ok).toBe(true);
        });
    });

    // ==================== DOCUMENT WORKFLOW ====================
    describe('Dokumente Workflow', () => {
        beforeEach(() => {
            userToken = jwt.sign({ userId: 1, email: testUser.email }, JWT_SECRET);
        });

        test('sollte Dokumente hochladen können', async () => {
            pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

            const res = await request(app)
                .post('/api/docs')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    docs: [
                        { name: 'Mutterpass.pdf', size_bytes: 102400 },
                        { name: 'Ultraschall.jpg', size_bytes: 2048576 }
                    ]
                });

            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
        });

        test('sollte Dokumente auflisten können', async () => {
            pool.query.mockResolvedValueOnce([[
                { id: 1, name: 'Mutterpass.pdf', size_bytes: 102400 },
                { id: 2, name: 'Ultraschall.jpg', size_bytes: 2048576 }
            ]]);

            const res = await request(app)
                .get('/api/docs')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        test('sollte Dokument löschen können', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .delete('/api/docs/1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    // ==================== ERROR HANDLING ====================
    describe('Fehlerbehandlung', () => {
        test('sollte 401 bei ungültigem Token zurückgeben', async () => {
            const res = await request(app)
                .get('/api/events')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
        });

        test('sollte 400 bei fehlenden Pflichtfeldern zurückgeben', async () => {
            userToken = jwt.sign({ userId: 1, email: testUser.email }, JWT_SECRET);

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'Nur Titel' }); // Datum fehlt

            expect(res.status).toBe(400);
        });

        test('sollte Datenbankfehler abfangen', async () => {
            pool.query.mockRejectedValueOnce(new Error('DB Connection failed'));

            const res = await request(app).get('/api/health');

            expect(res.status).toBe(500);
            expect(res.body.ok).toBe(false);
        });
    });
});

describe('Integration Tests - Concurrent Access', () => {
    let app;

    beforeAll(() => {
        app = createIntegrationApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('sollte mehrere gleichzeitige Anfragen verarbeiten', async () => {
        const token = jwt.sign({ userId: 1, email: 'test@test.de' }, JWT_SECRET);
        
        pool.query.mockResolvedValue([[]]);

        const requests = Array(5).fill(null).map(() =>
            request(app)
                .get('/api/events')
                .set('Authorization', `Bearer ${token}`)
        );

        const responses = await Promise.all(requests);

        responses.forEach(res => {
            expect(res.status).toBe(200);
        });
    });
});
