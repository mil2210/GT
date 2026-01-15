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

module.exports = pool;
