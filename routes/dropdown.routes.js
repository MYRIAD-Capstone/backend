const express = require("express");
const router = express.Router();
const fieldController = require("../controllers/dropdown.controllers");

router.get("/fields", fieldController.getActiveFields);
router.get("/doctors", fieldController.getActiveDoctors);

module.exports = router;
