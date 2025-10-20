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

function heartbeat() {
    this.isAlive = true;
}

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

    // biar koneksi tidak terputus ketika idle
    socket.isAlive = true;
    socket.on("pong", heartbeat);

    socket.on("message", (message, isBinary) => {
        try {
            const msgStr = isBinary
                ? message.toString("utf8")
                : message.toString();

            let datanya;
            if (msgStr.includes("{") && msgStr.includes("}")) {
                try {
                    datanya = JSON.parse(msgStr);
                    datanya.idsensor = idsensor;
                } catch (e) {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(
                            JSON.stringify({
                                success: false,
                                pesan: "Format JSON tidak valid",
                            })
                        );
                    }
                    return;
                }
                // {
                //     nilai: '', harus string
                //     iddata: 0,
                //     action: 'edit', 'delete'
                // }
            } else {
                datanya = {
                    idsensor: idsensor,
                    nilai: msgStr,
                    waktu: Date.now(),
                };
            }

            function isNumber(string) {
                const value = string.replace(",", ".");
                return !isNaN(value);
            }

            async function postData() {
                try {
                    const sensorSelected = await connection.promise().query(
                        `
                        SELECT sensor.*, user.passkey, struktur_data.string 
                        FROM sensor 
                        JOIN user ON user.id = sensor.id_user 
                        JOIN struktur_data ON sensor.id_struktur = struktur_data.id 
                        WHERE sensor.id = ?`,
                        [idsensor]
                    );
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

                    // let dataCur = await connection
                    //     .promise()
                    //     .query(`SELECT data FROM sensor WHERE id = ?;`, [
                    //         idsensor,
                    //     ]);
                    // let dataCurNew;
                    if (datanya.action) {
                        if (datanya.action == "delete") {
                            await connection
                                .promise()
                                .query(`DELETE FROM data WHERE id = ?;`, [
                                    datanya.iddata,
                                ]);
                            // dataCurNew = dataCur[0].filter(
                            //     (d) => d.id != datanya.iddata
                            // );
                        } else if (datanya.action == "edit") {
                            await connection
                                .promise()
                                .query(
                                    `UPDATE data SET nilai = ? WHERE id = ?;`,
                                    [datanya.iddata]
                                );
                            // dataCurNew = dataCur[0].map((d) => {
                            //     if (d.id == datanya.iddata) {
                            //         return {
                            //             ...d,
                            //             nilai: isNumber(datanya.nilai)
                            //                 ? Number(datanya.nilai)
                            //                 : datanya.nilai,
                            //         };
                            //     } else return d;
                            // });
                        } else {
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
                        const hasilInsert = await connection
                            .promise()
                            .query(
                                `INSERT INTO data (id_sensor, waktu, nilai) VALUES (?, ? ,?);`,
                                [idsensor, datanya.waktu, datanya.nilai]
                            );
                        // dataCurNew = [
                        //     ...dataCur[0],
                        //     {
                        //         id: hasilInsert[0].insertId,
                        //         idsensor: idsensor,
                        //         waktu: datanya.waktu,
                        //         nilai: isNumber(datanya.nilai)
                        //             ? Number(datanya.nilai)
                        //             : datanya.nilai,
                        //     },
                        // ];
                    }

                    sensors[idsensor].forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            if (client !== socket) {
                                client.send(
                                    JSON.stringify({
                                        ...datanya,
                                        action: datanya.action,
                                        idsensor: datanya.idsensor,
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

// 🔹 Tambahkan interval ping/pong untuk menjaga koneksi tetap hidup
const interval = setInterval(() => {
    server.clients.forEach((socket) => {
        if (socket.isAlive === false) {
            console.log("Socket tidak merespons ping, terminate...");
            return socket.terminate();
        }
        socket.isAlive = false;
        socket.ping();
    });
}, 30000);

// Bersihkan interval ketika server ditutup
server.on("close", function close() {
    clearInterval(interval);
});

console.log("WebSocket server running on ws://localhost:4002");
