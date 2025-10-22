const controller = require("../controllers/doctor.controllers.js");
const router = require("express").Router();

router.get("/dashboard", controller.getDoctorDashboard);

router.get("/availability", controller.getAvailabilitiesByDoctor);
router.post("/availability", controller.createAvailability);
router.get("/all", controller.getAllDoctors);
router.get("/doctor-by-id", controller.getDoctorById);
router.put("/profile", controller.updateDoctorProfile);
router.get("/available-times", controller.getAvailableTimeByDoctor);
router.get("/stats", controller.getDoctorStats);
module.exports = router;
