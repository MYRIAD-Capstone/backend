// controllers/appointment.controller.js
const { Sequelize } = require("sequelize");

const db = require("../models");
const Appointment = db.Appointment;
const Doctor = db.Doctor;
const jwt = require("jsonwebtoken");

exports.getAllAppointments = async (req, res) => {
	try {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) {
			return res.status(401).json({ message: "No token provided" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		// ✅ Fetch appointments (with doctor & availability)
		const appointments = await Appointment.findAll({
			where: { user_id: userId },
			include: [
				{
					model: Doctor,
					as: "doctor",
					attributes: [
						"doctor_id",
						"first_name",
						"middle_name",
						"last_name",
						"user_id",
					],
				},
				{
					model: DoctorAvailability,
					as: "availability",
					attributes: [
						"availability_id",
						"date",
						"start_time",
						"end_time",
						"status",
					],
				},
			],
			order: [
				["date", "ASC"],
				[DoctorAvailability, "start_time", "ASC"], // ✅ order by actual slot time
			],
		});

		res.status(200).json(appointments);
	} catch (error) {
		console.error("Error fetching user appointments:", error);
		res.status(500).json({
			message: "Something went wrong while fetching appointments.",
			error: error.message,
		});
	}
};

exports.getDoctorAppointments = async (req, res) => {
	try {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		// Find the doctor linked to this user
		const doctor = await db.Doctor.findOne({ where: { user_id: userId } });
		if (!doctor)
			return res.status(403).json({ message: "No doctor found for this user" });

		const appointments = await db.Appointment.findAll({
			where: { doctor_id: doctor.doctor_id },
			include: [
				{
					model: db.Doctor,
					as: "doctor",
					attributes: [
						"doctor_id",
						"first_name",
						"middle_name",
						"last_name",
						"user_id",
					],
				},
				{
					model: db.User,
					as: "user",
					attributes: ["user_id", "email"],
					include: [
						{
							model: db.Client,
							as: "clients",
							attributes: [
								"client_id",
								"first_name",
								"middle_name",
								"last_name",
								"contact_number",
							],
						},
					],
				},
				// ✅ Include DoctorAvailability (so we can access start_time / end_time)
				{
					model: db.DoctorAvailability,
					as: "availability",
					attributes: ["availability_id", "date", "start_time", "end_time"],
				},
			],
			order: [
				["date", "ASC"],
				// sort by availability start_time instead of appointment.time
				[
					{ model: db.DoctorAvailability, as: "availability" },
					"start_time",
					"ASC",
				],
			],
		});

		res.status(200).json(appointments);
	} catch (error) {
		console.error("Error fetching doctor appointments:", error);
		res.status(500).json({ message: "Something went wrong.", error });
	}
};

exports.getAppointmentsByDoctorId = async (req, res) => {
	try {
		const doctorId = req.query.doctor_id; // fetch doctor_id from query
		if (!doctorId)
			return res.status(400).json({ message: "Please provide a doctor_id" });

		// Validate doctor existence
		const doctor = await db.Doctor.findByPk(doctorId);
		if (!doctor) return res.status(404).json({ message: "Doctor not found" });

		// Fetch appointments
		const appointments = await db.Appointment.findAll({
			where: { doctor_id: doctorId },
			include: [
				{
					model: db.User,
					as: "user",
					attributes: ["user_id", "email"],
					include: [
						{
							model: db.Client,
							as: "clients",
							attributes: [
								"client_id",
								"first_name",
								"middle_name",
								"last_name",
								"contact_number",
							],
						},
					],
				},
				{
					model: db.DoctorAvailability,
					as: "availability",
					attributes: ["availability_id", "date", "start_time", "end_time"],
				},
			],
			order: [
				["date", "ASC"],
				[
					{ model: db.DoctorAvailability, as: "availability" },
					"start_time",
					"ASC",
				],
			],
		});

		res.status(200).json({ doctor, appointments });
	} catch (error) {
		console.error("Error fetching doctor appointments by ID:", error);
		res.status(500).json({ message: "Something went wrong.", error });
	}
};

// ✅ getClientAppointments
exports.getClientAppointments = async (req, res) => {
	try {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		const appointments = await db.Appointment.findAll({
			where: { user_id: userId },
			include: [
				{
					model: db.Doctor,
					as: "doctor",
					attributes: [
						"doctor_id",
						"first_name",
						"middle_name",
						"last_name",
						"user_id",
					],
				},
				{
					model: db.User,
					as: "user",
					attributes: ["user_id", "email"],
					include: [
						{
							model: db.Client,
							as: "clients",
							attributes: [
								"client_id",
								"first_name",
								"middle_name",
								"last_name",
								"contact_number",
							],
						},
					],
				},
				// ✅ Include DoctorAvailability (for availability time info)
				{
					model: db.DoctorAvailability,
					as: "availability",
					attributes: ["availability_id", "date", "start_time", "end_time"],
				},
			],
			order: [
				["date", "ASC"],
				[
					{ model: db.DoctorAvailability, as: "availability" },
					"start_time",
					"ASC",
				],
			],
		});

		res.status(200).json(appointments);
	} catch (error) {
		console.error("Error fetching client appointments:", error);
		res.status(500).json({ message: "Something went wrong.", error });
	}
};

// ✅ Cancel Appointment
exports.cancelAppointment = async (req, res) => {
	try {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		const { id } = req.params;

		// Find the appointment
		const appointment = await db.Appointment.findOne({
			where: { appointment_id: id, user_id: userId },
		});

		if (!appointment) {
			return res.status(404).json({ message: "Appointment not found" });
		}

		// Check if already past date
		const today = new Date();
		const appointmentDate = new Date(appointment.date);
		if (appointmentDate < today) {
			return res
				.status(400)
				.json({ message: "Cannot cancel past appointments" });
		}

		// Update status to 'Cancelled'
		await appointment.update({ status: "Cancelled" });

		res.status(200).json({ message: "Appointment cancelled successfully" });
	} catch (error) {
		console.error("Error cancelling appointment:", error);
		res
			.status(500)
			.json({ message: "Failed to cancel appointment", error: error.message });
	}
};

// ✅ Mark Appointment as Ongoing
exports.ongoingAppointment = async (req, res) => {
	try {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		const { id } = req.params;

		// Find the appointment
		const appointment = await db.Appointment.findOne({
			where: { appointment_id: id, user_id: userId },
		});

		if (!appointment) {
			return res.status(404).json({ message: "Appointment not found" });
		}

		// Check if the appointment is already ongoing or finished
		if (appointment.status === "Ongoing") {
			return res
				.status(400)
				.json({ message: "Appointment is already ongoing" });
		}
		if (appointment.status === "Cancelled") {
			return res.status(400).json({
				message: "Cancelled appointments cannot be marked as ongoing",
			});
		}

		// Prevent starting past or future appointments outside the time window
		const now = new Date();
		const appointmentDate = new Date(appointment.date);
		const startTime = new Date(`${appointment.date}T${appointment.start_time}`);
		const endTime = new Date(`${appointment.date}T${appointment.end_time}`);

		if (now < startTime) {
			return res
				.status(400)
				.json({ message: "Appointment has not started yet" });
		}
		if (now > endTime) {
			return res
				.status(400)
				.json({ message: "Appointment time has already passed" });
		}

		// Update status to 'Ongoing'
		await appointment.update({ status: "Ongoing" });

		res.status(200).json({ message: "Appointment marked as ongoing" });
	} catch (error) {
		console.error("Error updating appointment to ongoing:", error);
		res.status(500).json({
			message: "Failed to mark appointment as ongoing",
			error: error.message,
		});
	}
};

exports.completeAppointment = async (req, res) => {
	try {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;
		const { id } = req.params;

		const appointment = await Appointment.findOne({
			where: { appointment_id: id, user_id: userId },
		});
		if (!appointment)
			return res.status(404).json({ message: "Appointment not found" });

		if (appointment.status === "Completed")
			return res
				.status(400)
				.json({ message: "Appointment is already completed" });
		if (appointment.status === "Cancelled")
			return res
				.status(400)
				.json({ message: "Cancelled appointments cannot be completed" });

		await appointment.update({ status: "Completed" });
		res.status(200).json({ message: "Appointment marked as completed" });
	} catch (error) {
		console.error("Error completing appointment:", error);
		res.status(500).json({
			message: "Failed to mark appointment as completed",
			error: error.message,
		});
	}
};

// exports.getDoctorAppointments = async (req, res) => {
// 	try {
// 		const token = req.headers["authorization"]?.split(" ")[1];
// 		if (!token) return res.status(401).json({ message: "No token provided" });
// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		const userId = decoded.user_id;
// 		const doctor = await db.Doctor.findOne({ where: { user_id: userId } });
// 		if (!doctor)
// 			return res.status(403).json({ message: "No doctor found for this user" });
// 		const appointments = await db.Appointment.findAll({
// 			where: { doctor_id: doctor.doctor_id },
// 			include: [
// 				{
// 					model: db.Doctor,
// 					as: "doctor",
// 					attributes: [
// 						"doctor_id",
// 						"first_name",
// 						"middle_name",
// 						"last_name",
// 						"user_id",
// 					],
// 				},
// 				{
// 					model: db.User,
// 					as: "user", // Appointment → User
// 					attributes: ["user_id", "email"],
// 					include: [
// 						{
// 							model: db.Client,
// 							as: "clients", // MUST match the alias in db.js
// 							attributes: [
// 								"client_id",
// 								"first_name",
// 								"middle_name",
// 								"last_name",
// 								"contact_number",
// 							],
// 						},
// 					],
// 				},
// 			],
// 			order: [
// 				["date", "ASC"],
// 				["time", "ASC"],
// 			],
// 		});
// 		res.status(200).json(appointments);
// 	} catch (error) {
// 		console.error("Error fetching doctor appointments:", error);
// 		res.status(500).json({ message: "Something went wrong.", error });
// 	}
// };

// exports.getClientAppointments = async (req, res) => {
// 	try {
// 		const token = req.headers["authorization"]?.split(" ")[1];
// 		if (!token) return res.status(401).json({ message: "No token provided" });
// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		const userId = decoded.user_id;
// 		const appointments = await db.Appointment.findAll({
// 			where: { user_id: userId },
// 			include: [
// 				{
// 					model: db.Doctor,
// 					as: "doctor",
// 					attributes: [
// 						"doctor_id",
// 						"first_name",
// 						"middle_name",
// 						"last_name",
// 						"user_id",
// 					],
// 				},
// 				{
// 					model: db.User,
// 					as: "user",
// 					attributes: ["user_id", "email"],
// 					include: [
// 						{
// 							model: db.Client,
// 							as: "clients",
// 							attributes: [
// 								"client_id",
// 								"first_name",
// 								"middle_name",
// 								"last_name",
// 								"contact_number",
// 							],
// 						},
// 					],
// 				},
// 			],
// 			order: [
// 				["date", "ASC"],
// 				["time", "ASC"],
// 			],
// 		});
// 		res.status(200).json(appointments);
// 	} catch (error) {
// 		console.error("Error fetching doctor appointments:", error);
// 		res.status(500).json({ message: "Something went wrong.", error });
// 	}
// };

exports.createAppointment = async (req, res) => {
	try {
		const { doctor_id, user_id, date, timeSlot, remarks, availability_id } =
			req.body;

		if (!doctor_id || !user_id || !date) {
			return res.status(400).json({ message: "Required fields are missing" });
		}

		// Convert timeSlot string to start time (example: "9:00 AM - 10:00 AM")
		// const startTime = timeSlot.split(" - ")[0];
		const appointment = await Appointment.create({
			doctor_id,
			user_id,
			date,
			// time: startTime,
			remarks,
			status: "Pending",
			availability_id,
		});

		res.status(201).json({
			message: "Appointment created successfully",
			appointment,
		});
	} catch (error) {
		console.error("Error creating appointment:", error);
		res
			.status(500)
			.json({ message: "Failed to create appointment", error: error.message });
	}
};

exports.getMonthlyAppointments = async (req, res) => {
	try {
		const { year } = req.params;
		if (!year) {
			return res
				.status(400)
				.json({ message: "Year is required (e.g., ?year=2025)" });
		}

		const results = await Appointment.findAll({
			attributes: [
				[Sequelize.fn("MONTH", Sequelize.col("date")), "month"],
				[Sequelize.fn("COUNT", Sequelize.col("appointment_id")), "count"],
			],
			where: Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("date")), year),
			group: [Sequelize.fn("MONTH", Sequelize.col("date"))],
			order: [[Sequelize.fn("MONTH", Sequelize.col("date")), "ASC"]],
		});

		// Fill months with 0 if no appointments
		const monthlyData = Array.from({ length: 12 }, (_, i) => {
			const monthResult = results.find((r) => r.dataValues.month === i + 1);
			return {
				month: new Date(year, i).toLocaleString("default", { month: "short" }),
				count: monthResult ? parseInt(monthResult.dataValues.count, 10) : 0,
			};
		});

		res.status(200).json({
			year,
			data: monthlyData,
		});
	} catch (error) {
		console.error("Error fetching monthly appointments:", error);
		res.status(500).json({ message: "Server error", error });
	}
};
