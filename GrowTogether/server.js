const express = require("express");
const path = require("path");
const pool = require("./db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

app.use(express.json({ limit: "30mb" }));
app.use(express.static(path.join(__dirname, "public")));

function sha256(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

function auth(req, res, next) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    try {
        req.user = jwt.verify(token, JWT_SECRET); // { userId, email }
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

// Health check
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: "db down" });
    }
});

// ---------------- AUTH (passt zu users.password CHAR(64)) ----------------
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
        console.error(e);
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
        console.error(e);
        res.status(500).json({ error: "server error" });
    }
});

// ---------------- EVENTS (passt zu Tabelle calender & event_date) ----------------
// Frontend sendet/erwartet: {id,date,title,time,note,tag}
// DB: calender(id, user_id, event_date, title, time, note, tag)
app.get("/api/events", auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
         id,
         DATE_FORMAT(event_date, '%Y-%m-%d') AS date,
         title,
         time,
         note,
         tag
       FROM calender
       WHERE user_id = ?
       ORDER BY event_date ASC`,
            [req.user.userId]
        );
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

app.post("/api/events", auth, async (req, res) => {
    try {
        const { id, date, title, time, note, tag } = req.body || {};
        if (!id || !date || !title) return res.status(400).json({ error: "missing fields" });

        // id ist AUTO_INCREMENT in deiner SQL -> wir können id NICHT frei setzen.
        // Lösung: wenn id wie eine Zahl ist und schon existiert -> update, sonst insert neu ohne id.
        const numericId = Number(id);
        const hasNumericId = Number.isFinite(numericId);

        if (hasNumericId) {
            const [existing] = await pool.query(
                "SELECT id FROM calender WHERE id = ? AND user_id = ?",
                [numericId, req.user.userId]
            );

            if (existing.length) {
                await pool.query(
                    `UPDATE calender 
           SET event_date=?, title=?, time=?, note=?, tag=?
           WHERE id=? AND user_id=?`,
                    [date, title, time || "", note || "", tag || "", numericId, req.user.userId]
                );
                return res.json({ ok: true, mode: "updated", id: numericId });
            }
        }

        // Insert neu (ohne id)
        const [r] = await pool.query(
            `INSERT INTO calender (user_id, event_date, title, time, note, tag)
       VALUES (?,?,?,?,?,?)`,
            [req.user.userId, date, title, time || "", note || "", tag || ""]
        );

        res.json({ ok: true, mode: "inserted", id: r.insertId });
    } catch (e) {
        console.error(e);
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
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

// ---------------- STAMMDATEN (mother_data / child_data) ----------------
// WICHTIG: Deine SQL hat kein UNIQUE(user_id), also machen wir "update if exists else insert".

app.get("/api/profile/mother", auth, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM mother_data WHERE user_id = ? LIMIT 1", [req.user.userId]);
        console.log("[DEBUG mother GET] user_id=", req.user.userId, "birth_date=", rows[0]?.birth_date ?? null);
        res.json(rows[0] || null);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});


app.put("/api/profile/mother", auth, async (req, res) => {
    try {
        const d = req.body || {};
        console.log("[DEBUG mother PUT] payload.birth_date=", d?.birth_date ?? d?.mutterGebDatum ?? null);


        const payload = {
            name: d.name || d.mutterName || null,
            birth_date: d.birth_date || d.mutterGebDatum || null,
            address: d.address || d.mutterAdresse || null,
            contact: d.contact || d.mutterKontakt || null,
            insurance_number: d.insurance_number || d.mutterVersicherungsNr || null,
            blood_group: d.blood_group || d.mutterBlutgruppe || null,
            preconditions: d.preconditions || d.mutterVorerkrankungen || null,
            allergies: d.allergies || d.mutterAllergien || null,
            medications: d.medications || d.mutterMedikamente || null,
            previous_pregnancies: d.previous_pregnancies || d.mutterFruehereSS || null,
            profession: d.profession || d.mutterBeruf || null,
            risks: d.risks || d.mutterRisiken || null
        };

        const [rows] = await pool.query("SELECT id FROM mother_data WHERE user_id = ? LIMIT 1", [req.user.userId]);

        if (rows.length) {
            await pool.query(
                `UPDATE mother_data SET
           name=?,
           birth_date=?,
           address=?,
           contact=?,
           insurance_number=?,
           blood_group=?,
           preconditions=?,
           allergies=?,
           medications=?,
           previous_pregnancies=?,
           profession=?,
           risks=?
         WHERE user_id=?`,
                [
                    payload.name,
                    payload.birth_date,
                    payload.address,
                    payload.contact,
                    payload.insurance_number,
                    payload.blood_group,
                    payload.preconditions,
                    payload.allergies,
                    payload.medications,
                    payload.previous_pregnancies,
                    payload.profession,
                    payload.risks,
                    req.user.userId
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO mother_data
         (user_id, name, birth_date, address, contact, insurance_number, blood_group,
          preconditions, allergies, medications, previous_pregnancies, profession, risks)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    req.user.userId,
                    payload.name,
                    payload.birth_date,
                    payload.address,
                    payload.contact,
                    payload.insurance_number,
                    payload.blood_group,
                    payload.preconditions,
                    payload.allergies,
                    payload.medications,
                    payload.previous_pregnancies,
                    payload.profession,
                    payload.risks
                ]
            );
        }

        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

app.get("/api/profile/child", auth, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM child_data WHERE user_id = ? LIMIT 1", [req.user.userId]);
        console.log("[DEBUG child GET] user_id=", req.user.userId, "birth_date=", rows[0]?.birth_date ?? null);
        res.json(rows[0] || null);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});


app.put("/api/profile/child", auth, async (req, res) => {
    try {
        const d = req.body || {};
        console.log("[DEBUG child PUT] incoming payload:", d);

        const payload = {
            name: d.name || d.kindName || null,
            birth_date: d.birth_date || d.kindGebDatum || null,
            birth_time: d.birth_time || d.kindGebZeit || null,
            birth_place: d.birth_place || d.kindGebOrt || null,
            weight: d.weight ?? d.kindGewicht ?? null,
            height: d.height ?? d.kindGroesse ?? null,
            head_circumference: d.head_circumference ?? d.kindKopfumfang ?? null,
            apgar: d.apgar || d.kindAPGAR || null,
            blood_group: d.blood_group || d.kindBlutgruppe || null,
            screening: d.screening || d.kindScreening || null
        };
        console.log("[DEBUG child PUT] processed payload.birth_date=", payload.birth_date);

        const [rows] = await pool.query("SELECT id FROM child_data WHERE user_id = ? LIMIT 1", [req.user.userId]);

        if (rows.length) {
            await pool.query(
                `UPDATE child_data SET
           name=?,
           birth_date=?,
           birth_time=?,
           birth_place=?,
           weight=?,
           height=?,
           head_circumference=?,
           apgar=?,
           blood_group=?,
           screening=?
         WHERE user_id=?`,
                [
                    payload.name,
                    payload.birth_date,
                    payload.birth_time,
                    payload.birth_place,
                    payload.weight,
                    payload.height,
                    payload.head_circumference,
                    payload.apgar,
                    payload.blood_group,
                    payload.screening,
                    req.user.userId
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO child_data
         (user_id, name, birth_date, birth_time, birth_place, weight, height, head_circumference,
          apgar, blood_group, screening)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    req.user.userId,
                    payload.name,
                    payload.birth_date,
                    payload.birth_time,
                    payload.birth_place,
                    payload.weight,
                    payload.height,
                    payload.head_circumference,
                    payload.apgar,
                    payload.blood_group,
                    payload.screening
                ]
            );
        }

        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

// ---------------- FATHER DATA ----------------
app.get("/api/profile/father", auth, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM father_data WHERE user_id = ? LIMIT 1", [req.user.userId]);
        console.log("[DEBUG father GET] user_id=", req.user.userId, "birth_date=", rows[0]?.birth_date ?? null);
        res.json(rows[0] || null);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});


app.put("/api/profile/father", auth, async (req, res) => {
    try {
        const d = req.body || {};

        const payload = {
            name: d.name || d.vaterName || null,
            birth_date: d.birth_date || d.vaterGebDatum || null,
            address: d.address || d.vaterAdresse || null,
            contact: d.contact || d.vaterKontakt || null,
            profession: d.profession || d.vaterBeruf || null,
            allergies: d.allergies || d.vaterAllergien || null,
            medications: d.medications || d.vaterMedikamente || null
        };

        const [rows] = await pool.query("SELECT id FROM father_data WHERE user_id = ? LIMIT 1", [req.user.userId]);

        if (rows.length) {
            await pool.query(
                `UPDATE father_data SET
           name=?,
           birth_date=?,
           address=?,
           contact=?,
           profession=?,
           allergies=?,
           medications=?
         WHERE user_id=?`,
                [
                    payload.name,
                    payload.birth_date,
                    payload.address,
                    payload.contact,
                    payload.profession,
                    payload.allergies,
                    payload.medications,
                    req.user.userId
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO father_data
         (user_id, name, birth_date, address, contact, profession, allergies, medications)
         VALUES (?,?,?,?,?,?,?,?)`,
                [
                    req.user.userId,
                    payload.name,
                    payload.birth_date,
                    payload.address,
                    payload.contact,
                    payload.profession,
                    payload.allergies,
                    payload.medications
                ]
            );
        }

        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

// ---------------- DOCUMENTS (passt zu deiner SQL: filename, filepath, filesize) ----------------
// Dein Frontend sendet aktuell Base64 -> das passt NICHT zu deiner SQL.
// Lösung hier: wir speichern nur Metadaten und geben sie zurück.
// (Wenn du Base64 in DB willst: SQL ändern -> sag kurz, dann schicke ich das.)

app.get("/api/docs", auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, filename AS name, filesize AS size_bytes, upload_date AS created_date, filepath
       FROM documents
       WHERE user_id = ?
       ORDER BY upload_date DESC`,
            [req.user.userId]
        );
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

// Erwartet: { docs: [{ name, size_bytes, file_data (base64), ... }] }
app.post("/api/docs", auth, async (req, res) => {
    try {
        const { docs } = req.body || {};
        if (!Array.isArray(docs) || docs.length === 0) return res.status(400).json({ error: "no docs" });

        const duplicates = [];
        const toInsert = [];

        // Erst alle Dateien prüfen
        for (const d of docs) {
            const filename = d.name || "file";
            const filesize = Number(d.size_bytes || 0) || 0;
            const file_data = d.file_data || null; // Base64 string

            // Überprüfe, ob eine Datei mit diesem Namen bereits existiert
            const [existing] = await pool.query(
                "SELECT id FROM documents WHERE user_id = ? AND filename = ?",
                [req.user.userId, filename]
            );

            if (existing.length > 0) {
                duplicates.push(filename);
            } else {
                toInsert.push({ filename, filesize, file_data });
            }
        }

        // Wenn Duplikate gefunden → Fehler zurückgeben, nichts einfügen
        if (duplicates.length > 0) {
            return res.status(409).json({ 
                error: "duplicate files",
                duplicates: duplicates,
                message: `Die folgenden Dateien existieren bereits: ${duplicates.join(", ")}`
            });
        }

        // Nur einfügen, wenn KEINE Duplikate gefunden wurden
        for (const item of toInsert) {
            const filepath = `/virtual/${Date.now()}_${item.filename}`;
            await pool.query(
                `INSERT INTO documents (user_id, filename, filepath, filesize, file_data)
         VALUES (?,?,?,?,?)`,
                [req.user.userId, item.filename, filepath, item.filesize, item.file_data]
            );
        }

        res.status(201).json({ ok: true });
    } catch (e) {
        console.error(e);
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
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

// Download/View Endpoint
app.get("/api/docs/:id/file", auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT filename, file_data FROM documents WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.userId]
        );

        if (!rows.length) return res.status(404).json({ error: "not found" });

        const { filename, file_data } = rows[0];

        if (!file_data) {
            return res.status(400).json({ error: "no file data" });
        }

        // file_data ist ein Buffer/base64 string
        const buffer = Buffer.from(file_data.toString(), 'base64');
        
        res.set('Content-Disposition', `attachment; filename="${filename}"`);
        res.set('Content-Type', 'application/octet-stream');
        res.send(buffer);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

// Preview Endpoint (returns base64 for inline viewing)
app.get("/api/docs/:id/preview", auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT filename, file_data FROM documents WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.userId]
        );

        if (!rows.length) return res.status(404).json({ error: "not found" });

        const { filename, file_data } = rows[0];

        if (!file_data) {
            return res.status(400).json({ error: "no file data" });
        }

        // Determine MIME type based on extension
        let mimeType = "application/octet-stream";
        if (filename.endsWith(".pdf")) mimeType = "application/pdf";
        else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) mimeType = "image/jpeg";
        else if (filename.endsWith(".png")) mimeType = "image/png";
        else if (filename.endsWith(".gif")) mimeType = "image/gif";
        else if (filename.endsWith(".webp")) mimeType = "image/webp";

        res.json({
            filename,
            mimeType,
            data: file_data.toString() // base64 string
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db error" });
    }
});

// Fallback
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "startseite.html"));
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
