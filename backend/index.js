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
const clients = new Map(); // Map socket => { rooms: Set() }
const sensors = {};
let socketAdmin = null;
const keyAdmin = process.env.KEY_ADMIN;
const connLog = mysql.createPool({
    host: process.env.DB_LOG_HOST,
    user: process.env.DB_LOG_USER,
    password: process.env.DB_LOG_PASSWORD,
    database: process.env.DB_LOG_DBNAME,
    dateStrings: true,
});

function myLog(level = "info", message = "", context = {}, ip_address = null) {
    (async () => {
        try {
            const tglSkrg = getYmdHisNow();
            await connLog
                .promise()
                .query(
                    `INSERT INTO websocket (level, message, context, ip_address, created_at, updated_at) VALUES (?, ? ,?, ?, ? ,?);`,
                    [
                        level,
                        `[iotku.org] ${message}`,
                        JSON.stringify(context),
                        ip_address,
                        tglSkrg,
                        tglSkrg,
                    ],
                );
        } catch (error) {
            console.log(error);
        }
    })();
}

function heartbeat() {
    this.isAlive = true;
}

server.on("connection", (socket, req) => {
    const { query } = parse(req.url, true);
    const idsensor = query.idsensor ? query.idsensor : "XXXXX";
    const passkey = query.passkey ? query.passkey : "";
    const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress;
    const created_at = getYmdHisNow();
    if (!clients.get(socket)) {
        clients.set(socket, {
            rooms: new Set(),
            ip,
            created_at,
        });
    }

    if (!idsensor) {
        socket.send(
            JSON.stringify({
                success: false,
                pesan: "idsensor is required",
            }),
        );
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

    // kirim ke socket admin
    socketAdmin?.send(
        JSON.stringify({
            tipe: "data",
            success: true,
            message: `[${created_at}][INFO][${ip}] Connect with WebSocket Server!`,
            data: {
                clients: serializeClients(clients),
                rooms: serializeRooms(sensors),
            },
        }),
    );

    socket.on("message", (message, isBinary) => {
        try {
            const msgStr = isBinary
                ? message.toString("utf8")
                : message.toString();

            let datanya;
            if (msgStr.includes("{") && msgStr.includes("}")) {
                try {
                    datanya = JSON.parse(msgStr);
                    if (
                        datanya.isAdmin &&
                        !socketAdmin &&
                        datanya.key == keyAdmin
                    ) {
                        socketAdmin = socket;
                        socket.send(
                            JSON.stringify({
                                tipe: "admin",
                                success: true,
                                message: "Berhasil menyambungkan socket admin!",
                                data: {
                                    clients: serializeClients(clients),
                                    rooms: serializeRooms(sensors),
                                },
                            }),
                        );
                        myLog(
                            "info",
                            `Berhasil menyambungkan socket admin!`,
                            {},
                            ip,
                        );
                        return;
                    }
                    datanya.idsensor = idsensor;
                } catch (e) {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(
                            JSON.stringify({
                                success: false,
                                pesan: "Format JSON tidak valid",
                            }),
                        );
                    }
                    socketAdmin?.send(
                        JSON.stringify({
                            tipe: "log",
                            success: false,
                            message: `[${getYmdHisNow()}][ERROR][${ip}] Format JSON tidak valid! ${e.message}`,
                        }),
                    );
                    myLog(
                        "error",
                        `Format JSON tidak valid!`,
                        {
                            message: msgStr,
                            error: e,
                        },
                        ip,
                    );
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
                        [idsensor],
                    );
                    if (sensorSelected[0].length == 0) {
                        socketAdmin?.send(
                            JSON.stringify({
                                tipe: "log",
                                success: false,
                                message: `[${getYmdHisNow()}][WARNING][${ip}] Sensor ${idsensor} tidak ditemukan!`,
                            }),
                        );
                        myLog(
                            "warning",
                            `Sensor ${idsensor} tidak ditemukan!`,
                            {},
                            ip,
                        );
                        return;
                    }

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
                                }),
                            );
                        }
                        socketAdmin?.send(
                            JSON.stringify({
                                tipe: "log",
                                success: false,
                                message: `[${getYmdHisNow()}][WARNING][${ip}] ${isWrong[1]}`,
                            }),
                        );
                        myLog(
                            "warning",
                            isWrong[1],
                            {
                                passkey,
                                datanya,
                                sensorSelected: sensorSelected[0][0],
                            },
                            ip,
                        );
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

                            socketAdmin?.send(
                                JSON.stringify({
                                    tipe: "log",
                                    success: true,
                                    message: `[${getYmdHisNow()}][INFO][${ip}] Delete data Sensor ${idsensor} | Id data ${datanya.iddata}`,
                                }),
                            );
                            myLog(
                                "info",
                                `Delete data Sensor ${idsensor} | Id data ${datanya.iddata}`,
                                {
                                    datanya,
                                },
                                ip,
                            );
                        } else if (datanya.action == "edit") {
                            await connection
                                .promise()
                                .query(
                                    `UPDATE data SET nilai = ? WHERE id = ?;`,
                                    [datanya.nilai, datanya.iddata],
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
                            socketAdmin?.send(
                                JSON.stringify({
                                    tipe: "log",
                                    success: true,
                                    message: `[${getYmdHisNow()}][INFO][${ip}] Edit data Sensor ${idsensor} | Id data ${datanya.iddata} | Value : ${datanya.nilai}`,
                                }),
                            );
                            myLog(
                                "info",
                                `Edit data Sensor ${idsensor} | Id data ${datanya.iddata} | Value : ${datanya.nilai}`,
                                {
                                    datanya,
                                },
                                ip,
                            );
                        } else {
                            if (socket.readyState === WebSocket.OPEN) {
                                socket.send(
                                    JSON.stringify({
                                        success: false,
                                        pesan: "Action tidak dikenali!",
                                    }),
                                );
                            }
                            socketAdmin?.send(
                                JSON.stringify({
                                    tipe: "log",
                                    success: false,
                                    message: `[${getYmdHisNow()}][WARNING][${ip}] Action tidak dikenali!`,
                                }),
                            );
                            myLog(
                                "warning",
                                "Action tidak dikenali!",
                                {
                                    datanya,
                                },
                                ip,
                            );
                            return;
                        }
                    } else {
                        const hasilInsert = await connection
                            .promise()
                            .query(
                                `INSERT INTO data (id_sensor, waktu, nilai) VALUES (?, ? ,?);`,
                                [idsensor, datanya.waktu, datanya.nilai],
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
                        socketAdmin?.send(
                            JSON.stringify({
                                tipe: "log",
                                success: true,
                                message: `[${getYmdHisNow()}][INFO][${ip}] Add data Sensor ${idsensor} | Value ${datanya.nilai}`,
                            }),
                        );
                        myLog(
                            "info",
                            `Add data Sensor ${idsensor} | Value ${datanya.nilai}`,
                            {
                                datanya,
                            },
                            ip,
                        );
                    }

                    sensors[idsensor].forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            if (client !== socket) {
                                client.send(
                                    JSON.stringify({
                                        ...datanya,
                                        action: datanya.action,
                                        idsensor: datanya.idsensor,
                                    }),
                                ); // Kirim pesan ke semua klien
                            } else {
                                socket.send(
                                    JSON.stringify({
                                        success: true,
                                        pesan: "Data berhasil terupdate",
                                    }),
                                );
                            }
                        }
                    });
                } catch (error) {
                    sensors[idsensor].forEach((client) => {
                        if (
                            client !== socket &&
                            client.readyState === WebSocket.OPEN
                        ) {
                            client.send(
                                JSON.stringify({
                                    success: false,
                                    pesan: "Terjadi kesalahan pada server websocket",
                                }),
                            ); // Kirim pesan ke semua klien
                        }
                    });
                    socketAdmin?.send(
                        JSON.stringify({
                            tipe: "log",
                            success: false,
                            message: `[${getYmdHisNow()}][ERROR][${ip}] Terjadi kesalahan pada server websocket! ${error.message}`,
                        }),
                    );
                    myLog(
                        "error",
                        `Terjadi kesalahan pada server websocket!`,
                        {
                            error,
                        },
                        ip,
                    );
                }
            }
            postData();
        } catch (error) {
            socketAdmin?.send(
                JSON.stringify({
                    tipe: "log",
                    success: false,
                    message: `[${getYmdHisNow()}][ERROR][${ip}] Terjadi kesalahan pada server websocket! ${error.message}`,
                }),
            );
            myLog(
                "error",
                `Terjadi kesalahan pada server websocket!`,
                {
                    error,
                },
                ip,
            );
        }
    });

    socket.on("close", () => {
        sensors[idsensor].delete(socket);
        if (sensors[idsensor].size === 0) {
            delete sensors[idsensor];
        }
        clients.delete(socket);
        if (socket == socketAdmin) {
            socketAdmin = null;
        } else {
            socketAdmin?.send(
                JSON.stringify({
                    tipe: "data",
                    success: true,
                    message: `[${getYmdHisNow()}][INFO][${ip}] Socket terputus!`,
                    data: {
                        clients: serializeClients(clients),
                        rooms: serializeRooms(sensors),
                    },
                }),
            );
        }
        myLog(
            "info",
            `Socket terputus!`,
            {
                socket,
                sensors,
            },
            ip,
        );
    });
});

// 🔹 Tambahkan interval ping/pong untuk menjaga koneksi tetap hidup
const interval = setInterval(() => {
    server.clients.forEach((socket) => {
        if (socket.isAlive === false) {
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

function getYmdHisNow() {
    const now = new Date();
    const jakartaTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );
    const pad = (n) => String(n).padStart(2, "0");
    const formattedDate =
        `${jakartaTime.getFullYear()}-` +
        `${pad(jakartaTime.getMonth() + 1)}-` +
        `${pad(jakartaTime.getDate())} ` +
        `${pad(jakartaTime.getHours())}:` +
        `${pad(jakartaTime.getMinutes())}:` +
        `${pad(jakartaTime.getSeconds())}`;

    return formattedDate;
}

function serializeClients(clients) {
    const result = [];
    for (const [socket, info] of clients.entries()) {
        result.push({
            ip: info.ip,
            created_at: info.created_at,
            rooms: Array.from(info.rooms),
            readyState: socket.readyState,
        });
    }
    return result;
}

function serializeRooms(rooms) {
    return Object.entries(rooms).map(([room_id, sockets]) => ({
        room_id,
        size: sockets.size,
    }));
}
