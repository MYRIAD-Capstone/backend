// routes/event.routes.js
const express = require("express");
const router = express.Router();

// ✅ Make sure the filename is correct: "../controllers/event.controller.js"
const eventController = require("../controllers/event.controllers");
const upload = require("../middleware/upload");

// ✅ Routes
router.post("/", upload.single("image"), eventController.createEvent);
router.get("/", eventController.getAllEvents);
router.get("/stats/:year", eventController.getMonthlyEvents);
router.get("/upcoming", eventController.getUpcomingEventsThisMonth);
router.delete("/:event_id", eventController.deleteEvent);
router.get("/stats-2", eventController.getEventStats);
module.exports = router;
