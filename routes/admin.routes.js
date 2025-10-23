const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controllers.js");
router.put("/profile", adminController.updateAdminProfile);
router.get("/profile", adminController.getAdminProfile);
module.exports = router;
