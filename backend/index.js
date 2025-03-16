require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = 8082;
const authRoute = require("./routes/auth.route.js");
const sensorRoute = require("./routes/sensor.route.js");

app.use(cors());
app.use(express.json());

app.get("/backend/", (req, res) => {
    res.send("Backend IOT Apps");
});

// routes
app.use("/backend/auth", authRoute);
app.use("/backend/sensor", sensorRoute);

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
    const idsensor = query.idsensor;

    if (!idsensor) {
        server.close(1008, "idsensor is required");
        return;
    }

    //kalau idsensornya blm ada
    if (!sensors[idsensor]) {
        sensors[idsensor] = new Set();
    }

    sensors[idsensor].add(socket);
    console.log(`Client telah terkoneksi ke sensor ${idsensor}`);

    socket.on("message", (message) => {
        try {
            const datanya = {
                idsensor: idsensor,
                nilai: Number(message),
                waktu: Date.now(),
            };
            console.log(datanya);
            sensors[idsensor].forEach((client) => {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(datanya)); // Kirim pesan ke semua klien
                }
            });
        } catch (error) {
            console.log(error.message);
        }
    });

    socket.on("close", () => {
        sensors[idsensor].delete(socket);
        console.log(`Client left sensor ${idsensor}`);

        if (sensors[idsensor].size === 0) {
            delete sensors[idsensor];
        }
    });
});

console.log("WebSocket server running on ws://localhost:4002");
3;
