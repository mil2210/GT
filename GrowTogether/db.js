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

// Migration: Füge file_data Spalte hinzu, falls sie nicht existiert
async function runMigrations() {
    try {
        const conn = await pool.getConnection();
        
        // Prüfe ob file_data Spalte existiert
        const [rows] = await conn.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_NAME = 'documents' AND COLUMN_NAME = 'file_data' AND TABLE_SCHEMA = ?`,
            [process.env.DB_NAME || "growtogether"]
        );
        
        if (rows.length === 0) {
            // Spalte existiert nicht, füge sie hinzu
            console.log("Migration: Füge file_data Spalte zur documents Tabelle hinzu...");
            await conn.query(
                `ALTER TABLE documents ADD COLUMN file_data LONGBLOB DEFAULT NULL`
            );
            console.log("✓ Migration erfolgreich: file_data Spalte hinzugefügt");
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
