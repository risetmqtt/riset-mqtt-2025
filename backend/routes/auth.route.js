const express = require("express");
const router = express.Router();
const { login } = require("../controllers/auth.controller.js");

router.post("/", login);

module.exports = router;
