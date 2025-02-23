require("dotenv").config();
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.status(401).json({ pesan: "Unauthorized" });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
        if (err) return res.status(401).json({ pesan: "Unauthorized" });
        req.user = payload;
        next();
    });
}

module.exports = authenticateToken;
