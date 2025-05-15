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

const searchSensor = async (req, res) => {
    const idSensor = req.params.id;
    try {
        const data = await connection.promise().query(`
            SELECT 
                sensor.* ,
                struktur_data.satuan, 
                struktur_data.string, 
                user.email 
            FROM sensor 
            JOIN struktur_data ON sensor.id_struktur = struktur_data.id 
            JOIN user ON sensor.id_user = user.id
            WHERE sensor.id = '${idSensor}'`);
        let dataFix = [];
        data[0].forEach((d) => {
            const elm = {
                ...d,
                data: JSON.parse(d.data),
                id_user_lain: JSON.parse(d.id_user_lain),
            };
            dataFix.push(elm);
        });
        if (dataFix.length > 0) return res.status(200).json(dataFix[0]);
        else return res.status(400).json({ pesan: "Data tidak ditemukan" });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const getAll = async (req, res) => {
    const iduser = req.user.id;
    const emailuser = req.user.email;
    const idSensor = req.params.id;
    const { pag = 1 } = req.query;
    try {
        let query = "";
        if (idSensor)
            query = `
            SELECT 
                sensor.id, sensor.label, sensor.id_struktur, sensor.id_user, sensor.id_user_lain, 
                struktur_data.satuan, 
                struktur_data.string, 
                user.email 
            FROM sensor 
            JOIN struktur_data ON sensor.id_struktur = struktur_data.id 
            JOIN user ON sensor.id_user = user.id
            WHERE sensor.id = '${idSensor}'`;
        else
            query = `
            SELECT 
                sensor.id, sensor.label, sensor.id_struktur, sensor.id_user, sensor.id_user_lain, 
                struktur_data.satuan, 
                struktur_data.string, 
                user.email 
            FROM sensor 
            JOIN struktur_data ON sensor.id_struktur = struktur_data.id 
            JOIN user ON sensor.id_user = user.id
            WHERE sensor.id_user = '${iduser}' OR sensor.id_user_lain LIKE '%${emailuser}%'`;
        const data = await connection.promise().query(query);
        let dataFix = [];
        for (let i = 0; i < data[0].length; i++) {
            const d = data[0][i];
            const fetchData = await connection.promise().query(`
                SELECT data.waktu, data.nilai FROM data WHERE id_sensor = '${
                    d.id
                }' ORDER BY waktu DESC LIMIT 100 OFFSET ${(pag - 1) * 100}`);
            const panjangData = await connection.promise().query(`
                SELECT COUNT(*) as panjang FROM data WHERE id_sensor = '${d.id}'`);
            dataFix.push({
                ...d,
                panjangData: panjangData[0][0].panjang,
                id_user_lain: JSON.parse(d.id_user_lain),
                data: fetchData[0].map((d) => {
                    return {
                        waktu: Number(d.waktu),
                        nilai: d.nilai,
                    };
                }),
            });
        }
        if (idSensor) {
            if (dataFix.length > 0) {
                if (
                    dataFix[0].id_user == iduser ||
                    dataFix[0].id_user_lain.includes(emailuser)
                ) {
                    return res.status(200).json(dataFix[0]);
                }
                return res.status(403).json({ pesan: "TIdak diizinkan" });
            } else {
                return res.status(200).json({ pesan: "Data tidak ditemukan" });
            }
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
                .query(`SELECT * FROM user WHERE email = '${idUser}'`);
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
const postUserLain = async (req, res) => {
    const idSensor = req.params.id;
    const idUser = req.user.id;
    const emailUser = req.user.email;
    try {
        const data = await connection.promise().query(`
            SELECT * FROM sensor WHERE id = '${idSensor}'`);
        if (data[0].length == 0) {
            return res.status(400).json({ pesan: "Sensor tidak ditemukan" });
        }
        if (data[0][0].id_user == idUser) {
            return res
                .status(400)
                .json({ pesan: "Anda sudah pernah menambahkan" });
        }
        const idUserLain = JSON.parse(data[0][0].id_user_lain);
        if (idUserLain.includes(String(emailUser))) {
            return res
                .status(400)
                .json({ pesan: "Anda sudah pernah menambahkan" });
        }
        idUserLain.push(String(emailUser));
        await connection
            .promise()
            .query(
                `UPDATE sensor set id_user_lain = ? WHERE id = '${idSensor}';`,
                [JSON.stringify(idUserLain)]
            );
        res.status(200).json({
            pesan: `Sensor berhasil ditambahkan`,
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};

const postSensor = async (req, res) => {
    const idUser = req.user.id;
    try {
        const { label, satuan: id_struktur } = req.body;
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
const putSensor = async (req, res) => {
    const idUser = req.user.id;
    const idSensor = req.params.id;
    try {
        const { label, satuan: id_struktur } = req.body;
        if (!label || !id_struktur)
            return res.status(400).json({ pesan: "Parameter tidak lengkap" });
        const fetchSensorCur = await connection
            .promise()
            .query(`SELECT * FROM sensor WHERE id = '${idSensor}';`);
        if (fetchSensorCur[0].length == 0) {
            return res.status(400).json({ pesan: "Sensor tidak ditemukan" });
        }
        if (fetchSensorCur[0][0].id_user != idUser) {
            return res.status(403).json({ pesan: "Anda tidak diizinkan" });
        }
        await connection
            .promise()
            .query(
                `UPDATE sensor set label = ?, id_struktur = ? WHERE id = '${idSensor}';`,
                [label, id_struktur]
            );
        res.status(200).json({ pesan: "Sensor berhasil diedit" });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
function isNumber(string) {
    const value = string.replace(",", ".");
    return !isNaN(value);
}
const postData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const { waktu, nilai } = req.body;
        const sensorSelected = await connection.promise().query(`
            SELECT sensor.data, sensor.label, struktur_data.string
            FROM sensor 
            JOIN struktur_data ON sensor.id_struktur = struktur_data.id
            WHERE sensor.id = '${idSensor}';`);
        if (sensorSelected[0].length == 0)
            return res.status(400).json({ pesan: "Sensor tidak ditemukan" });

        if (sensorSelected[0][0].string && isNumber(nilai)) {
            return res.status(400).json({ pesan: "Data harus berupa string" });
        } else if (!sensorSelected[0][0].string && !isNumber(nilai)) {
            return res.status(400).json({ pesan: "Data harus berupa number" });
        }
        // let dataCur = JSON.parse(sensorSelected[0][0].data);
        // dataCur.push({
        //     waktu: waktu ? waktu : Date.now(),
        //     nilai: ,
        // });
        await connection
            .promise()
            .query(
                `INSERT INTO data (id_sensor, waktu, nilai) VALUES (?,?,?)`,
                [idSensor, waktu ? waktu : Date.now(), nilai]
            );
        // await connection
        //     .promise()
        //     .query(`UPDATE sensor set data = ? WHERE id = '${idSensor}';`, [
        //         JSON.stringify(dataCur),
        //     ]);
        res.status(200).json({
            pesan: `Data sensor ${sensorSelected[0][0].label} berhasil ditambahkan`,
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const putData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const { index, nilai } = req.body; //index itu id data
        const sensorSelected = await connection.promise().query(`
            SELECT sensor.data, sensor.label, struktur_data.string
            FROM sensor 
            JOIN struktur_data ON sensor.id_struktur = struktur_data.id
            WHERE sensor.id = '${idSensor}';`);
        if (sensorSelected[0].length == 0)
            return res.status(400).json({ pesan: "Sensor tidak ditemukan" });

        if (sensorSelected[0][0].string && isNumber(nilai)) {
            return res.status(400).json({ pesan: "Data harus berupa string" });
        } else if (!sensorSelected[0][0].string && !isNumber(nilai)) {
            return res.status(400).json({ pesan: "Data harus berupa number" });
        }
        await connection
            .promise()
            .query(`UPDATE data set nilai = ? WHERE id = '${index}';`, [nilai]);
        // const dataCur = JSON.parse(sensorSelected[0][0].data);
        // const dataCurNem = dataCur.map((d, ind_d) => {
        //     if (ind_d == index) {
        //         return {
        //             ...d,
        //             nilai: isNumber(nilai) ? Number(nilai) : nilai,
        //         };
        //     } else return d;
        // });
        // await connection
        //     .promise()
        //     .query(`UPDATE sensor set data = ? WHERE id = '${idSensor}';`, [
        //         JSON.stringify(dataCurNem),
        //     ]);
        res.status(200).json({
            pesan: `Data sensor ${sensorSelected[0][0].label} berhasil ditambahkan`,
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const deleteData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const { index } = req.body; //index itu id data
        const sensorSelected = await connection.promise().query(`
            SELECT sensor.data, sensor.label, struktur_data.string
            FROM sensor 
            JOIN struktur_data ON sensor.id_struktur = struktur_data.id
            WHERE sensor.id = '${idSensor}';`);
        if (sensorSelected[0].length == 0)
            return res.status(400).json({ pesan: "Sensor tidak ditemukan" });

        await connection
            .promise()
            .query(`DELETE FROM data WHERE id = '${index}';`);
        // const dataCur = JSON.parse(sensorSelected[0][0].data);
        // const dataCurNem = dataCur.filter((d, ind_d) => {
        //     return ind_d == index ? false : true;
        // });
        // await connection
        //     .promise()
        //     .query(`UPDATE sensor set data = ? WHERE id = '${idSensor}';`, [
        //         JSON.stringify(dataCurNem),
        //     ]);
        res.status(200).json({
            pesan: `Data sensor ${sensorSelected[0][0].label} berhasil ditambahkan`,
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const resetData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const iduser = req.user.id;
        const getSensorCur = await connection
            .promise()
            .query(`SELECT * FROM sensor WHERE id = '${idSensor}';`);
        if (getSensorCur[0][0].id_user == iduser) {
            // await connection
            //     .promise()
            //     .query(`UPDATE sensor set data = ? WHERE id = '${idSensor}';`, [
            //         JSON.stringify([]),
            //     ]);
            await connection
                .promise()
                .query(`DELETE FROM data WHERE id_sensor = '${idSensor}';`);
            res.status(200).json({
                pesan: `Data record berhasil direset`,
            });
        } else {
            res.status(400).json({
                pesan: `Anda tidak diizinkan mereset data`,
            });
        }
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const deleteSensor = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const iduser = req.user.id;
        const emailuser = req.user.email;
        const getSensorCur = await connection
            .promise()
            .query(`SELECT * FROM sensor WHERE id = '${idSensor}';`);
        if (getSensorCur[0][0].id_user == iduser) {
            await connection
                .promise()
                .query(`DELETE FROM sensor WHERE id = '${idSensor}';`);
            await connection
                .promise()
                .query(`DELETE FROM data WHERE id_sensor = '${idSensor}';`);
        } else {
            const idUserLain = JSON.parse(getSensorCur[0][0].id_user_lain);
            const idUserLainNew = idUserLain.filter((e) => e != emailuser);
            await connection
                .promise()
                .query(
                    `UPDATE sensor set id_user_lain = ? WHERE id = '${idSensor}';`,
                    [JSON.stringify(idUserLainNew)]
                );
        }
        res.status(200).json({
            pesan: `Record berhasil dihapus`,
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};

const fixData = async (req, res) => {
    try {
        const idSensor = req.params.id;
        const sensorSelected = await connection.promise().query(`
            SELECT sensor.data
            FROM sensor 
            WHERE sensor.id = '${idSensor}';`);
        if (sensorSelected[0].length == 0)
            return res.status(400).json({ pesan: "Sensor tidak ditemukan" });
        const dataCur = JSON.parse(sensorSelected[0][0].data);
        for (let i = 0; i < dataCur.length; i++) {
            const d = dataCur[i];
            if (d.nilai) {
                await connection
                    .promise()
                    .query(
                        `INSERT INTO data (id_sensor, waktu, nilai) VALUES (?,?,?)`,
                        [idSensor, d.waktu, d.nilai]
                    );
            }
        }
        res.status(200).json({
            pesan: `Data sensor ${idSensor} berhasil ditambahkan`,
        });
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
const getAllSensorWithoutFilter = async (req, res) => {
    try {
        const data = await connection.promise().query(`
            SELECT sensor.id, sensor.label 
            FROM sensor`);
        return res.status(200).json(data[0]);
    } catch (error) {
        res.status(500).json({ pesan: error.message });
    }
};
module.exports = {
    getAll,
    postSensor,
    postData,
    getUserLain,
    postUserLain,
    resetData,
    deleteSensor,
    searchSensor,
    putData,
    deleteData,
    putSensor,
    fixData,
    getAllSensorWithoutFilter,
};
