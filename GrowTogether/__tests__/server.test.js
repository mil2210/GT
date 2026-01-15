/**
 * Jest Tests für den Server (API-Endpunkte)
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock für die Datenbank
jest.mock('../db', () => ({
    query: jest.fn()
}));

const pool = require('../db');

// SHA256 Hilfsfunktion (wie im Server)
function sha256(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

// Server-Setup für Tests (ohne echten DB-Pool)
const JWT_SECRET = 'test-secret';

function createTestApp() {
    const app = express();
    app.use(express.json({ limit: "30mb" }));

    // Auth Middleware
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

    // Health Check
    app.get("/api/health", async (req, res) => {
        try {
            await pool.query("SELECT 1");
            res.json({ ok: true });
        } catch (e) {
            res.status(500).json({ ok: false, error: "db down" });
        }
    });

    // Register
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

    // Login
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

describe('Server API Tests', () => {
    let app;
    let validToken;

    beforeAll(() => {
        app = createTestApp();
        validToken = jwt.sign({ userId: 1, email: 'test@test.de' }, JWT_SECRET, { expiresIn: '7d' });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ==================== HEALTH CHECK ====================
    describe('GET /api/health', () => {
        test('sollte ok:true zurückgeben wenn DB erreichbar', async () => {
            pool.query.mockResolvedValueOnce([[]]);

            const res = await request(app).get('/api/health');

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });

        test('sollte 500 zurückgeben wenn DB nicht erreichbar', async () => {
            pool.query.mockRejectedValueOnce(new Error('DB Error'));

            const res = await request(app).get('/api/health');

            expect(res.status).toBe(500);
            expect(res.body.ok).toBe(false);
        });
    });

    // ==================== REGISTRATION ====================
    describe('POST /api/auth/register', () => {
        test('sollte Benutzer erfolgreich registrieren', async () => {
            pool.query
                .mockResolvedValueOnce([[]]) // Email existiert nicht
                .mockResolvedValueOnce([{ insertId: 1 }]); // Insert erfolgreich

            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'testuser', email: 'test@test.de', password: 'password123' });

            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
            expect(res.body.userId).toBe(1);
        });

        test('sollte 400 zurückgeben wenn Felder fehlen', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'testuser' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('missing fields');
        });

        test('sollte 409 zurückgeben wenn Email bereits existiert', async () => {
            pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // Email existiert

            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'testuser', email: 'exists@test.de', password: 'password123' });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('email exists');
        });
    });

    // ==================== LOGIN ====================
    describe('POST /api/auth/login', () => {
        test('sollte Benutzer erfolgreich einloggen', async () => {
            const passwordHash = sha256('password123');
            pool.query.mockResolvedValueOnce([[{
                id: 1,
                username: 'testuser',
                email: 'test@test.de',
                password: passwordHash
            }]]);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.de', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.email).toBe('test@test.de');
            expect(res.body.username).toBe('testuser');
        });

        test('sollte 400 zurückgeben wenn Felder fehlen', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.de' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('missing fields');
        });

        test('sollte 401 zurückgeben bei falschem Passwort', async () => {
            const passwordHash = sha256('password123');
            pool.query.mockResolvedValueOnce([[{
                id: 1,
                username: 'testuser',
                email: 'test@test.de',
                password: passwordHash
            }]]);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.de', password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('bad credentials');
        });

        test('sollte 401 zurückgeben wenn Benutzer nicht existiert', async () => {
            pool.query.mockResolvedValueOnce([[]]);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'unknown@test.de', password: 'password123' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('bad credentials');
        });
    });

    // ==================== EVENTS ====================
    describe('Events API', () => {
        test('GET /api/events sollte 401 ohne Token zurückgeben', async () => {
            const res = await request(app).get('/api/events');
            expect(res.status).toBe(401);
        });

        test('GET /api/events sollte Events für authentifizierten Benutzer zurückgeben', async () => {
            const mockEvents = [
                { id: 1, date: '2026-01-20', title: 'Arzttermin', time: '10:00', note: '', tag: 'health' }
            ];
            pool.query.mockResolvedValueOnce([mockEvents]);

            const res = await request(app)
                .get('/api/events')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockEvents);
        });

        test('POST /api/events sollte neues Event erstellen', async () => {
            pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ id: 'new-1', date: '2026-01-20', title: 'Neuer Termin', time: '14:00' });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.mode).toBe('inserted');
        });

        test('POST /api/events sollte 400 bei fehlenden Feldern zurückgeben', async () => {
            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ date: '2026-01-20' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('missing fields');
        });

        test('DELETE /api/events/:id sollte Event löschen', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .delete('/api/events/1')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    // ==================== DOCUMENTS ====================
    describe('Documents API', () => {
        test('GET /api/docs sollte 401 ohne Token zurückgeben', async () => {
            const res = await request(app).get('/api/docs');
            expect(res.status).toBe(401);
        });

        test('GET /api/docs sollte Dokumente für authentifizierten Benutzer zurückgeben', async () => {
            const mockDocs = [
                { id: 1, name: 'test.pdf', size_bytes: 1024, filepath: '/virtual/test.pdf' }
            ];
            pool.query.mockResolvedValueOnce([mockDocs]);

            const res = await request(app)
                .get('/api/docs')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDocs);
        });

        test('POST /api/docs sollte Dokumente hochladen', async () => {
            pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

            const res = await request(app)
                .post('/api/docs')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ docs: [{ name: 'test.pdf', size_bytes: 1024 }] });

            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
        });

        test('POST /api/docs sollte 400 bei leerer docs-Liste zurückgeben', async () => {
            const res = await request(app)
                .post('/api/docs')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ docs: [] });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('no docs');
        });

        test('DELETE /api/docs/:id sollte Dokument löschen', async () => {
            pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .delete('/api/docs/1')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });

    // ==================== AUTH MIDDLEWARE ====================
    describe('Auth Middleware', () => {
        test('sollte 401 bei ungültigem Token zurückgeben', async () => {
            const res = await request(app)
                .get('/api/events')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Invalid token');
        });

        test('sollte 401 bei fehlendem Token zurückgeben', async () => {
            const res = await request(app).get('/api/events');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Missing token');
        });
    });
});
