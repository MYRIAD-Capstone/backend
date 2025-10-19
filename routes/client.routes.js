const express = require("express");
const router = express.Router();

// Import the controller
const controller = require("../controllers/client.controllers.js");

router.get("/all", controller.getAllClients);
router.put("/profile", controller.updateProfile);

module.exports = router;
