const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: true,
});

router.get("/", async (req, res) => {
    try {
        const data = await connection
            .promise()
            .query(`SELECT * FROM struktur_data`);
        res.status(200).json(data[0]);
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
});

module.exports = router;
