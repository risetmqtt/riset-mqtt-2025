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

const getAll = async (req, res) => {
    const iduser = req.user.id;
    const idSensor = req.params.id;
    try {
        let query = "";
        if (idSensor)
            query = `
        SELECT 
            sensor.* ,
            struktur_data.satuan 
            FROM sensor 
            JOIN struktur_data ON sensor.id_struktur = struktur_data.id 
            WHERE sensor.id = '${idSensor}'`;
        else
            query = `
            SELECT 
                sensor.*,
                struktur_data.satuan 
            FROM sensor 
            JOIN struktur_data ON sensor.id_struktur = struktur_data.id 
            WHERE sensor.id_user = '${iduser}'`;
        const data = await connection.promise().query(query);
        let dataFix = [];
        data[0].forEach((d) => {
            const elm = {
                ...d,
                data: JSON.parse(d.data),
                id_user_lain: JSON.parse(d.id_user_lain),
            };
            dataFix.push(elm);
        });
        if (idSensor) {
            return res
                .status(200)
                .json(
                    dataFix.length == 0
                        ? { pesan: "Data tidak ditemukan" }
                        : dataFix[0]
                );
        } else return res.status(200).json(dataFix);
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const getUserLain = async (req, res) => {
    const idSensor = req.params.id;
    try {
        const data = await connection.promise().query(`
            SELECT * FROM sensor WHERE id = '${idSensor}'`);
        if (data[0].length == 0) {
            return res.status(200).json({ pesan: "Sensor tidak ditemukan" });
        }
        const idUserLain = JSON.parse(data[0][0].id_user_lain);
        let users = [];
        for (let i = 0; i < idUserLain.length; i++) {
            const idUser = idUserLain[i];
            const user = await connection
                .promise()
                .query(`SELECT * FROM user WHERE id = '${idUser}'`);
            if (user[0].length > 0) {
                users.push({
                    id: user[0][0].id,
                    email: user[0][0].email,
                });
            }
        }
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};

const postSensor = async (req, res) => {
    const idUser = req.user.id;
    try {
        const { label, id_struktur } = req.body;
        if (!label || !id_struktur)
            return res.status(400).json({ pesan: "Parameter tidak lengkap" });
        const fetchTerakhir = await connection
            .promise()
            .query(`SELECT sensor.id FROM sensor ORDER BY id DESC;`);
        let dataTerakhir = "00001";
        if (fetchTerakhir[0].length > 0)
            dataTerakhir = (
                "0000" +
                (Number(fetchTerakhir[0][0].id) + 1)
            ).slice(-5);
        await connection
            .promise()
            .query(
                `INSERT INTO sensor (id, label, id_struktur, id_user, id_user_lain, data) VALUES (?,?,?,?,?,?)`,
                [
                    dataTerakhir,
                    label,
                    id_struktur,
                    idUser,
                    JSON.stringify([]),
                    JSON.stringify([]),
                ]
            );
        res.status(200).json({ pesan: "Sensor berhasil ditambahkan" });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const postData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const { waktu, nilai } = req.body;
        const sensorSelected = await connection.promise().query(`
                SELECT * FROM sensor WHERE sensor.id = '${idSensor}'`);
        if (sensorSelected[0].length == 0)
            return res.status(400).json({ pesan: "Sensor tidak ditemukan" });

        let dataCur = JSON.parse(sensorSelected[0][0].data);
        dataCur.push({ waktu, nilai });
        await connection
            .promise()
            .query(`UPDATE sensor set data = ? WHERE id = '${idSensor}';`, [
                JSON.stringify(dataCur),
            ]);
        res.status(200).json({
            pesan: `Data sensor ${sensorSelected[0][0].label} berhasil ditambahkan`,
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
module.exports = { getAll, postSensor, postData, getUserLain };
