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
const server = new WebSocket.Server({ port: 4002 });

server.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("message", (message) => {
        try {
            const textMessage = message.toString();
            const data = JSON.parse(textMessage);
            console.log("Received: ");
            console.log(data);

            server.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(textMessage); // Kirim pesan ke semua klien
                }
            });
        } catch (error) {
            console.log(error.message);
        }
    });

    socket.on("close", () => {
        console.log("Client disconnected");
    });
});

console.log("WebSocket server running on ws://localhost:4002");
