// routes/appointment.routes.js
const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controllers.js");

router.get("/", appointmentController.getAllAppointments);
router.post("/", appointmentController.createAppointment);
router.get("/doctor", appointmentController.getDoctorAppointments);
router.get("/client", appointmentController.getClientAppointments);
router.get("/stats/:year", appointmentController.getMonthlyAppointments);
router.put("/:id/cancel", appointmentController.cancelAppointment);
router.put("/:id/ongoing", appointmentController.ongoingAppointment);
router.put("/:id/complete", appointmentController.completeAppointment);
router.get("/by-doctor", appointmentController.getAppointmentsByDoctorId);
router.get("/stats", appointmentController.getDoctorAppointments);

module.exports = router;
