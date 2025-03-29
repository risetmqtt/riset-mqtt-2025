const express = require("express");
const router = express.Router();
const {
    login,
    signup,
    passkey,
    getPasskey,
    getUser,
} = require("../controllers/auth.controller.js");
const authenticateToken = require("./jwt.route.js");

router.post("/", login);
router.post("/passkey", authenticateToken, passkey);
router.get("/passkey", authenticateToken, getPasskey);
router.post("/signup", signup);
router.get("/user", authenticateToken, getUser);

module.exports = router;
