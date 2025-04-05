const express = require("express");
const router = express.Router();
const authenticateToken = require("./jwt.route.js");
const {
    getAll,
    postData,
    postSensor,
    getUserLain,
    postUserLain,
    resetData,
    deleteSensor,
    searchSensor,
} = require("../controllers/sensor.controller.js");

router.get("/", authenticateToken, getAll);
router.get("/:id", authenticateToken, getAll);
router.get("/search/:id", authenticateToken, searchSensor);
router.get("/userlain/:id", authenticateToken, getUserLain);
router.post("/userlain/:id", authenticateToken, postUserLain);
router.post("/", authenticateToken, postSensor);
router.post("/:id", authenticateToken, postData);
router.post("/reset/:id", authenticateToken, resetData);
router.post("/delete/:id", authenticateToken, deleteSensor);

module.exports = router;
