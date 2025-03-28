require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: true,
});

const login = async (req, res) => {
    try {
        const { email, sandi } = req.body;
        const user = await connection
            .promise()
            .query(`SELECT * FROM user WHERE email = '${email}'`);
        if (user[0].length == 0)
            return res.status(404).json({ pesan: "Email tidak ditemukan" });
        bcrypt.compare(sandi, user[0][0].sandi, (err, result) => {
            if (err) {
                return res
                    .status(500)
                    .json({ pesan: "Error comparing passwords" });
            }
            const payload = {
                id: user[0][0].id,
                email: email,
            };
            if (result) {
                const accessToken = jwt.sign(
                    payload,
                    process.env.ACCESS_TOKEN_SECRET
                );
                res.status(200).json({
                    token: accessToken,
                    idUser: user[0][0].id,
                    emailUser: email,
                });
            } else {
                res.status(401).json({ pesan: "Sandi salah" });
            }
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const signup = async (req, res) => {
    try {
        const { email, sandi } = req.body;
        const user = await connection
            .promise()
            .query(`SELECT * FROM user WHERE email = '${email}'`);
        if (user[0].length > 0)
            return res.status(404).json({ pesan: "Email telah digunakan" });
        bcrypt.hash(sandi, 10, async (err, hash) => {
            if (err) {
                return res
                    .status(500)
                    .json({ pesan: "Error hashing passwords" });
            }
            await connection
                .promise()
                .query(`INSERT INTO user (email, sandi) VALUES (?,?)`, [
                    email,
                    hash,
                ]);
            res.status(200).json({ pesan: "Akun berhasil dibuat" });
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};

module.exports = { login, signup };
