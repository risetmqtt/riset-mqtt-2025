require("dotenv").config();
const express = require("express");
const router = express.Router();
const authenticateToken = require("./jwt.route.js");
const {
    pingAdmin,
    getUsers,
    putUser,
    getStructures,
    postStructure,
    putStructure,
    deleteStructure,
    getSensors,
    postSensor,
    getSensorDetail,
    putSensor,
    deleteSensor,
    postSensorData,
    putSensorData,
    deleteSensorData,
} = require("../controllers/admin.controller.js");

function authorizeAdmin(req, res, next) {
    const raw = String(process.env.EMAIL_ADMIN || "");
    const admins = raw
        .split(";")
        .map((x) => x.trim().toLowerCase())
        .filter((x) => x !== "");
    const emailUser = String(req.user?.email || "").toLowerCase();
    if (!admins.includes(emailUser)) {
        return res.status(403).json({ pesan: "Anda bukan admin" });
    }
    next();
}

router.use(authenticateToken, authorizeAdmin);

router.get("/ping", pingAdmin);

router.get("/users", getUsers);
router.put("/users/:id", putUser);

router.get("/structures", getStructures);
router.post("/structures", postStructure);
router.put("/structures/:id", putStructure);
router.delete("/structures/:id", deleteStructure);

router.get("/sensors", getSensors);
router.post("/sensors", postSensor);
router.get("/sensors/:id", getSensorDetail);
router.put("/sensors/:id", putSensor);
router.delete("/sensors/:id", deleteSensor);
router.post("/sensors/:id/data", postSensorData);
router.put("/sensors/:id/data/:idData", putSensorData);
router.delete("/sensors/:id/data/:idData", deleteSensorData);

module.exports = router;
