const express = require("express");
const router = express.Router();
const authenticateToken = require("./jwt.route.js");
const {
    getAll,
    postData,
    postSensor,
    getUserLain,
} = require("../controllers/sensor.controller.js");

router.get("/", authenticateToken, getAll);
router.get("/:id", authenticateToken, getAll);
router.get("/userlain/:id", authenticateToken, getUserLain);
router.post("/", authenticateToken, postSensor);
router.post("/:id", authenticateToken, postData);

module.exports = router;
