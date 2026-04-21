require("dotenv").config();
const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: true,
});

function toPositiveInt(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.floor(parsed);
}

function parseJsonArray(value) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function isNumber(string) {
    const value = String(string).replace(",", ".");
    return !isNaN(value);
}

const pingAdmin = async (req, res) => {
    return res.status(200).json({
        success: true,
        pesan: "Anda login sebagai admin",
    });
};

const getUsers = async (req, res) => {
    try {
        const pag = toPositiveInt(req.query.pag, 1);
        const limit = toPositiveInt(req.query.limit, 10);
        const offset = (pag - 1) * limit;
        const search = String(req.query.search || "").trim();

        let whereClause = "";
        const whereValues = [];
        if (search) {
            whereClause = "WHERE email LIKE ?";
            whereValues.push(`%${search}%`);
        }

        const [rows] = await connection
            .promise()
            .query(
                `SELECT id, email, passkey
                 FROM user
                 ${whereClause}
                 ORDER BY id DESC
                 LIMIT ? OFFSET ?`,
                [...whereValues, limit, offset],
            );

        const [countRows] = await connection
            .promise()
            .query(
                `SELECT COUNT(*) AS total
                 FROM user
                 ${whereClause}`,
                whereValues,
            );

        return res.status(200).json({
            data: rows,
            pagination: {
                pag,
                limit,
                total: countRows[0].total,
                totalPage: Math.ceil(countRows[0].total / limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const putUser = async (req, res) => {
    try {
        const idUser = req.params.id;
        const { email, passkey, sandi } = req.body;
        if (!email || typeof email !== "string") {
            return res.status(400).json({ pesan: "Email wajib diisi" });
        }

        const [findUser] = await connection
            .promise()
            .query(`SELECT id FROM user WHERE id = ?`, [idUser]);
        if (findUser.length === 0) {
            return res.status(404).json({ pesan: "User tidak ditemukan" });
        }

        const [findEmail] = await connection
            .promise()
            .query(`SELECT id FROM user WHERE email = ? AND id <> ?`, [
                email,
                idUser,
            ]);
        if (findEmail.length > 0) {
            return res.status(400).json({ pesan: "Email sudah digunakan" });
        }

        if (sandi && String(sandi).trim() !== "") {
            const hash = await bcrypt.hash(String(sandi), 10);
            await connection
                .promise()
                .query(
                    `UPDATE user SET email = ?, passkey = ?, sandi = ? WHERE id = ?`,
                    [email, String(passkey || ""), hash, idUser],
                );
        } else {
            await connection
                .promise()
                .query(`UPDATE user SET email = ?, passkey = ? WHERE id = ?`, [
                    email,
                    String(passkey || ""),
                    idUser,
                ]);
        }

        return res.status(200).json({ pesan: "User berhasil diubah" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const getStructures = async (req, res) => {
    try {
        const pag = toPositiveInt(req.query.pag, 1);
        const limit = toPositiveInt(req.query.limit, 10);
        const offset = (pag - 1) * limit;
        const search = String(req.query.search || "").trim();

        let whereClause = "";
        const whereValues = [];
        if (search) {
            whereClause = "WHERE nama LIKE ? OR satuan LIKE ?";
            whereValues.push(`%${search}%`, `%${search}%`);
        }

        const [rows] = await connection
            .promise()
            .query(
                `SELECT id, nama, satuan, string
                 FROM struktur_data
                 ${whereClause}
                 ORDER BY id DESC
                 LIMIT ? OFFSET ?`,
                [...whereValues, limit, offset],
            );

        const [countRows] = await connection
            .promise()
            .query(
                `SELECT COUNT(*) AS total
                 FROM struktur_data
                 ${whereClause}`,
                whereValues,
            );

        return res.status(200).json({
            data: rows,
            pagination: {
                pag,
                limit,
                total: countRows[0].total,
                totalPage: Math.ceil(countRows[0].total / limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const postStructure = async (req, res) => {
    try {
        const { nama, satuan, string } = req.body;
        if (!nama || typeof nama !== "string") {
            return res.status(400).json({ pesan: "Nama wajib diisi" });
        }
        if (!satuan || typeof satuan !== "string") {
            return res.status(400).json({ pesan: "Satuan wajib diisi" });
        }

        await connection.promise().query(
            `INSERT INTO struktur_data (nama, satuan, string)
             VALUES (?, ?, ?)`,
            [nama, satuan, !!string],
        );

        return res.status(200).json({ pesan: "Struktur data berhasil dibuat" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const putStructure = async (req, res) => {
    try {
        const id = req.params.id;
        const { nama, satuan, string } = req.body;
        if (!nama || typeof nama !== "string") {
            return res.status(400).json({ pesan: "Nama wajib diisi" });
        }
        if (!satuan || typeof satuan !== "string") {
            return res.status(400).json({ pesan: "Satuan wajib diisi" });
        }

        const [exists] = await connection
            .promise()
            .query(`SELECT id FROM struktur_data WHERE id = ?`, [id]);
        if (exists.length === 0) {
            return res.status(404).json({ pesan: "Struktur data tidak ditemukan" });
        }

        await connection.promise().query(
            `UPDATE struktur_data
             SET nama = ?, satuan = ?, string = ?
             WHERE id = ?`,
            [nama, satuan, !!string, id],
        );

        return res.status(200).json({ pesan: "Struktur data berhasil diubah" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const deleteStructure = async (req, res) => {
    try {
        const id = req.params.id;
        const [used] = await connection
            .promise()
            .query(`SELECT COUNT(*) AS total FROM sensor WHERE id_struktur = ?`, [
                id,
            ]);
        if (used[0].total > 0) {
            return res.status(400).json({
                pesan: "Struktur data sedang dipakai sensor dan tidak bisa dihapus",
            });
        }

        await connection
            .promise()
            .query(`DELETE FROM struktur_data WHERE id = ?`, [id]);
        return res.status(200).json({ pesan: "Struktur data berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const getSensors = async (req, res) => {
    try {
        const pag = toPositiveInt(req.query.pag, 1);
        const limit = toPositiveInt(req.query.limit, 10);
        const offset = (pag - 1) * limit;
        const search = String(req.query.search || "").trim();

        let whereClause = "";
        const whereValues = [];
        if (search) {
            whereClause =
                "WHERE sensor.id LIKE ? OR sensor.label LIKE ? OR user.email LIKE ?";
            whereValues.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [rows] = await connection.promise().query(
            `SELECT
                sensor.id,
                sensor.label,
                sensor.id_struktur,
                sensor.id_user,
                sensor.id_user_lain,
                user.email AS owner_email,
                struktur_data.nama AS struktur_nama,
                struktur_data.satuan AS struktur_satuan,
                struktur_data.string AS struktur_string
             FROM sensor
             JOIN user ON user.id = sensor.id_user
             JOIN struktur_data ON struktur_data.id = sensor.id_struktur
             ${whereClause}
             ORDER BY sensor.id DESC
             LIMIT ? OFFSET ?`,
            [...whereValues, limit, offset],
        );

        const [countRows] = await connection.promise().query(
            `SELECT COUNT(*) AS total
             FROM sensor
             JOIN user ON user.id = sensor.id_user
             ${whereClause}`,
            whereValues,
        );

        const fixedRows = rows.map((row) => ({
            ...row,
            id_user_lain: parseJsonArray(row.id_user_lain),
        }));

        return res.status(200).json({
            data: fixedRows,
            pagination: {
                pag,
                limit,
                total: countRows[0].total,
                totalPage: Math.ceil(countRows[0].total / limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const createSensorId = async () => {
    const [latestRows] = await connection
        .promise()
        .query(`SELECT id FROM sensor ORDER BY id DESC LIMIT 1`);
    if (latestRows.length === 0) return "00001";
    return (`0000${Number(latestRows[0].id) + 1}`).slice(-5);
};

const postSensor = async (req, res) => {
    try {
        const { label, id_struktur, id_user, id_user_lain } = req.body;
        if (!label || !id_struktur || !id_user) {
            return res.status(400).json({ pesan: "Parameter tidak lengkap" });
        }

        const [ownerRows] = await connection
            .promise()
            .query(`SELECT id FROM user WHERE id = ?`, [id_user]);
        if (ownerRows.length === 0) {
            return res.status(400).json({ pesan: "Owner tidak ditemukan" });
        }

        const [strukturRows] = await connection
            .promise()
            .query(`SELECT id FROM struktur_data WHERE id = ?`, [id_struktur]);
        if (strukturRows.length === 0) {
            return res.status(400).json({ pesan: "Struktur data tidak ditemukan" });
        }

        const generatedId = await createSensorId();
        await connection.promise().query(
            `INSERT INTO sensor (id, label, id_struktur, id_user, id_user_lain, data)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                generatedId,
                label,
                id_struktur,
                id_user,
                JSON.stringify(Array.isArray(id_user_lain) ? id_user_lain : []),
                JSON.stringify([]),
            ],
        );

        return res.status(200).json({ pesan: "Sensor berhasil ditambahkan" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const getSensorDetail = async (req, res) => {
    try {
        const id = req.params.id;
        const pagData = toPositiveInt(req.query.pagData, 1);
        const limitData = toPositiveInt(req.query.limitData, 20);
        const offsetData = (pagData - 1) * limitData;

        const [sensorRows] = await connection.promise().query(
            `SELECT
                sensor.id,
                sensor.label,
                sensor.id_struktur,
                sensor.id_user,
                sensor.id_user_lain,
                user.email AS owner_email,
                struktur_data.nama AS struktur_nama,
                struktur_data.satuan AS struktur_satuan,
                struktur_data.string AS struktur_string
             FROM sensor
             JOIN user ON user.id = sensor.id_user
             JOIN struktur_data ON struktur_data.id = sensor.id_struktur
             WHERE sensor.id = ?`,
            [id],
        );
        if (sensorRows.length === 0) {
            return res.status(404).json({ pesan: "Sensor tidak ditemukan" });
        }

        const sensor = sensorRows[0];
        const userLainEmails = parseJsonArray(sensor.id_user_lain);
        let usersLain = [];
        if (userLainEmails.length > 0) {
            const [userRows] = await connection.promise().query(
                `SELECT id, email FROM user WHERE email IN (?)`,
                [userLainEmails],
            );
            usersLain = userRows;
        }

        const [dataRows] = await connection.promise().query(
            `SELECT id, id_sensor, waktu, nilai
             FROM data
             WHERE id_sensor = ?
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [id, limitData, offsetData],
        );
        const [countRows] = await connection
            .promise()
            .query(`SELECT COUNT(*) AS total FROM data WHERE id_sensor = ?`, [id]);

        return res.status(200).json({
            sensor: {
                ...sensor,
                id_user_lain: userLainEmails,
                users_lain: usersLain,
            },
            data: dataRows,
            paginationData: {
                pag: pagData,
                limit: limitData,
                total: countRows[0].total,
                totalPage: Math.ceil(countRows[0].total / limitData),
            },
        });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const putSensor = async (req, res) => {
    try {
        const id = req.params.id;
        const { label, id_struktur, id_user, id_user_lain } = req.body;
        if (!label || !id_struktur || !id_user) {
            return res.status(400).json({ pesan: "Parameter tidak lengkap" });
        }

        const [sensorRows] = await connection
            .promise()
            .query(`SELECT id FROM sensor WHERE id = ?`, [id]);
        if (sensorRows.length === 0) {
            return res.status(404).json({ pesan: "Sensor tidak ditemukan" });
        }

        const [ownerRows] = await connection
            .promise()
            .query(`SELECT id FROM user WHERE id = ?`, [id_user]);
        if (ownerRows.length === 0) {
            return res.status(400).json({ pesan: "Owner tidak ditemukan" });
        }

        const [strukturRows] = await connection
            .promise()
            .query(`SELECT id FROM struktur_data WHERE id = ?`, [id_struktur]);
        if (strukturRows.length === 0) {
            return res.status(400).json({ pesan: "Struktur data tidak ditemukan" });
        }

        await connection.promise().query(
            `UPDATE sensor
             SET label = ?, id_struktur = ?, id_user = ?, id_user_lain = ?
             WHERE id = ?`,
            [
                label,
                id_struktur,
                id_user,
                JSON.stringify(Array.isArray(id_user_lain) ? id_user_lain : []),
                id,
            ],
        );

        return res.status(200).json({ pesan: "Sensor berhasil diubah" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const deleteSensor = async (req, res) => {
    try {
        const id = req.params.id;
        await connection.promise().query(`DELETE FROM data WHERE id_sensor = ?`, [id]);
        await connection.promise().query(`DELETE FROM sensor WHERE id = ?`, [id]);
        return res.status(200).json({ pesan: "Sensor berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const postSensorData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const { waktu, nilai } = req.body;
        if (nilai === undefined || nilai === null || String(nilai) === "") {
            return res.status(400).json({ pesan: "Nilai wajib diisi" });
        }

        const [sensorRows] = await connection.promise().query(
            `SELECT sensor.id, struktur_data.string
             FROM sensor
             JOIN struktur_data ON struktur_data.id = sensor.id_struktur
             WHERE sensor.id = ?`,
            [idSensor],
        );
        if (sensorRows.length === 0) {
            return res.status(404).json({ pesan: "Sensor tidak ditemukan" });
        }

        if (sensorRows[0].string && isNumber(String(nilai))) {
            return res.status(400).json({ pesan: "Data harus berupa string" });
        } else if (!sensorRows[0].string && !isNumber(String(nilai))) {
            return res.status(400).json({ pesan: "Data harus berupa number" });
        }

        await connection.promise().query(
            `INSERT INTO data (id_sensor, waktu, nilai)
             VALUES (?, ?, ?)`,
            [idSensor, waktu ? Number(waktu) : Date.now(), String(nilai)],
        );

        return res.status(200).json({ pesan: "Data sensor berhasil ditambahkan" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const putSensorData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const idData = req.params.idData;
        const { nilai, waktu } = req.body;
        if (nilai === undefined || nilai === null || String(nilai) === "") {
            return res.status(400).json({ pesan: "Nilai wajib diisi" });
        }

        const [sensorRows] = await connection.promise().query(
            `SELECT sensor.id, struktur_data.string
             FROM sensor
             JOIN struktur_data ON struktur_data.id = sensor.id_struktur
             WHERE sensor.id = ?`,
            [idSensor],
        );
        if (sensorRows.length === 0) {
            return res.status(404).json({ pesan: "Sensor tidak ditemukan" });
        }

        const [dataRows] = await connection
            .promise()
            .query(`SELECT id FROM data WHERE id = ? AND id_sensor = ?`, [
                idData,
                idSensor,
            ]);
        if (dataRows.length === 0) {
            return res.status(404).json({ pesan: "Data tidak ditemukan" });
        }

        if (sensorRows[0].string && isNumber(String(nilai))) {
            return res.status(400).json({ pesan: "Data harus berupa string" });
        } else if (!sensorRows[0].string && !isNumber(String(nilai))) {
            return res.status(400).json({ pesan: "Data harus berupa number" });
        }

        if (waktu !== undefined && waktu !== null && String(waktu) !== "") {
            await connection
                .promise()
                .query(`UPDATE data SET nilai = ?, waktu = ? WHERE id = ?`, [
                    String(nilai),
                    Number(waktu),
                    idData,
                ]);
        } else {
            await connection
                .promise()
                .query(`UPDATE data SET nilai = ? WHERE id = ?`, [
                    String(nilai),
                    idData,
                ]);
        }

        return res.status(200).json({ pesan: "Data sensor berhasil diubah" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

const deleteSensorData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const idData = req.params.idData;
        const [dataRows] = await connection
            .promise()
            .query(`SELECT id FROM data WHERE id = ? AND id_sensor = ?`, [
                idData,
                idSensor,
            ]);
        if (dataRows.length === 0) {
            return res.status(404).json({ pesan: "Data tidak ditemukan" });
        }
        await connection.promise().query(`DELETE FROM data WHERE id = ?`, [idData]);
        return res.status(200).json({ pesan: "Data sensor berhasil dihapus" });
    } catch (error) {
        return res.status(500).json({ pesan: error.message });
    }
};

module.exports = {
    pingAdmin,
    getUsers,
    putUser,
    getStructures,
    postStructure,
    putStructure,
    deleteStructure,
    getSensors,
    postSensor,
    getSensorDetail,
    putSensor,
    deleteSensor,
    postSensorData,
    putSensorData,
    deleteSensorData,
};
