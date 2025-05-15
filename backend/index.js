require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = 8082;
const authRoute = require("./routes/auth.route.js");
const sensorRoute = require("./routes/sensor.route.js");
const satuanRoute = require("./routes/satuan.route.js");
const mysql = require("mysql2");
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: true,
});

app.use(cors());
app.use(express.json());

app.get("/backend/", (req, res) => {
    res.send("Backend IOT Apps");
});

// routes
app.use("/backend/auth", authRoute);
app.use("/backend/sensor", sensorRoute);
app.use("/backend/satuan", satuanRoute);

app.listen(port, "0.0.0.0", () => {
    console.log(`Backend IOT app listening on port ${port}`);
});

// ===================================================

const WebSocket = require("ws");
const { parse } = require("url");
const server = new WebSocket.Server({ port: 4002 });
const sensors = {};
server.on("connection", (socket, req) => {
    const { query } = parse(req.url, true);
    const idsensor = query.idsensor ? query.idsensor : "XXXXX";
    const passkey = query.passkey ? query.passkey : "";

    if (!idsensor) {
        server.close(1008, "idsensor is required");
        return;
    }

    //kalau idsensornya blm ada
    if (!sensors[idsensor]) {
        sensors[idsensor] = new Set();
    }

    sensors[idsensor].add(socket);
    // console.log(`Client telah terkoneksi ke sensor ${idsensor}`);

    socket.on("message", (message) => {
        try {
            let datanya;
            if (
                message.toString().includes("{") &&
                message.toString().includes("}")
            ) {
                datanya = JSON.parse(message.toString());
                datanya.idsensor = idsensor;
                // {
                //     nilai: '', harus string
                //     index: 0,
                //     action: 'edit', 'delete'
                // }
            } else {
                datanya = {
                    idsensor: idsensor,
                    nilai: message.toString(),
                    waktu: Date.now(),
                };
            }
            // console.log(datanya);

            function isNumber(string) {
                const value = string.replace(",", ".");
                return !isNaN(value);
            }

            async function postData() {
                try {
                    const sensorSelected = await connection.promise().query(`
                        SELECT sensor.*, user.passkey, struktur_data.string 
                        FROM sensor 
                        JOIN user ON user.id = sensor.id_user 
                        JOIN struktur_data ON sensor.id_struktur = struktur_data.id 
                        WHERE sensor.id = '${idsensor}'`);
                    if (sensorSelected[0].length == 0)
                        return console.log(
                            `Sensor ${idsensor} tidak ditemukan (ini dari socket)`
                        );

                    let isWrong = [false, ""];

                    if (
                        sensorSelected[0][0].string &&
                        isNumber(datanya.nilai)
                    ) {
                        isWrong[0] = true;
                        isWrong[1] = "Data harus berupa string";
                    } else if (
                        !sensorSelected[0][0].string &&
                        !isNumber(datanya.nilai)
                    ) {
                        isWrong[0] = true;
                        isWrong[1] = "Data harus berupa number";
                    }

                    if (sensorSelected[0][0].passkey != passkey) {
                        isWrong[0] = true;
                        isWrong[1] = "Passkey salah";
                    }
                    if (isWrong[0]) {
                        if (socket.readyState === WebSocket.OPEN) {
                            socket.send(
                                JSON.stringify({
                                    success: false,
                                    pesan: isWrong[1],
                                })
                            );
                        }
                        return;
                    }
                    let dataCur = JSON.parse(sensorSelected[0][0].data);
                    let dataCurNew;
                    if (datanya.action) {
                        if (datanya.action == "delete")
                            dataCurNew = dataCur.filter(
                                (d, ind_d) => ind_d != datanya.index
                            );
                        else if (datanya.action == "edit")
                            dataCurNew = dataCur.map((d, ind_d) => {
                                if (ind_d == datanya.index) {
                                    return {
                                        ...d,
                                        nilai: isNumber(datanya.nilai)
                                            ? Number(datanya.nilai)
                                            : datanya.nilai,
                                    };
                                } else return d;
                            });
                        else {
                            if (socket.readyState === WebSocket.OPEN) {
                                socket.send(
                                    JSON.stringify({
                                        success: false,
                                        pesan: "Action tidak dikenali",
                                    })
                                );
                            }
                            return;
                        }
                    } else {
                        dataCurNew = [
                            ...dataCur,
                            {
                                waktu: datanya.waktu,
                                nilai: isNumber(datanya.nilai)
                                    ? Number(datanya.nilai)
                                    : datanya.nilai,
                            },
                        ];
                    }
                    await connection
                        .promise()
                        .query(
                            `UPDATE sensor set data = ? WHERE id = '${idsensor}';`,
                            [JSON.stringify(dataCurNew)]
                        );

                    sensors[idsensor].forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            if (client !== socket) {
                                client.send(
                                    JSON.stringify({
                                        ...datanya,
                                        action: datanya.action,
                                        index: datanya.index,
                                    })
                                ); // Kirim pesan ke semua klien
                            } else {
                                socket.send(
                                    JSON.stringify({
                                        success: true,
                                        pesan: "Data berhasil terupdate",
                                    })
                                );
                            }
                        }
                    });
                } catch (error) {
                    console.error(error.message);
                    sensors[idsensor].forEach((client) => {
                        if (
                            client !== socket &&
                            client.readyState === WebSocket.OPEN
                        ) {
                            client.send(
                                JSON.stringify({
                                    success: false,
                                    pesan: "Terjadi kesalahan pada server websocket",
                                })
                            ); // Kirim pesan ke semua klien
                        }
                    });
                }
            }
            postData();
        } catch (error) {
            console.log(error.message);
        }
    });

    socket.on("close", () => {
        sensors[idsensor].delete(socket);
        // console.log(`Client left sensor ${idsensor}`);

        if (sensors[idsensor].size === 0) {
            delete sensors[idsensor];
        }
    });
});

console.log("WebSocket server running on ws://localhost:4002");
