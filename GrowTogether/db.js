const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "growtogether",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
});

// Migrationen: fehlende Spalten sicher hinzufügen
async function runMigrations() {
    try {
        const conn = await pool.getConnection();
        const schema = process.env.DB_NAME || "growtogether";

        async function columnExists(table, column) {
            const [rows] = await conn.query(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND TABLE_SCHEMA = ?`,
                [table, column, schema]
            );
            return rows.length > 0;
        }

        // 1) documents.file_data (LONGBLOB)
        if (!(await columnExists("documents", "file_data"))) {
            console.log("Migration: Füge documents.file_data Spalte hinzu...");
            await conn.query(
                `ALTER TABLE documents ADD COLUMN file_data LONGBLOB DEFAULT NULL`
            );
            console.log("✓ Migration: documents.file_data hinzugefügt");
        }

        // 2) Stammdaten birth_date (DATE) - muss für Mutter/Vater/Kind existieren
        const birthTables = ["mother_data", "father_data", "child_data"];
        for (const t of birthTables) {
            if (!(await columnExists(t, "birth_date"))) {
                console.log(`Migration: Füge ${t}.birth_date Spalte hinzu...`);
                await conn.query(`ALTER TABLE ${t} ADD COLUMN birth_date DATE NULL`);
                console.log(`✓ Migration: ${t}.birth_date hinzugefügt`);
            }
        }

        conn.release();
    } catch (e) {
        console.error("Migration Fehler:", e.message);
        // Fehler beim Ausführen der Migration - nicht kritisch, nur warning
    }
}


// Führe Migrationen aus
runMigrations();

module.exports = pool;
