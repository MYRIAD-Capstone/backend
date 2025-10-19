const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controllers");

router.get("/counts", dashboardController.getCounts);

module.exports = router;
