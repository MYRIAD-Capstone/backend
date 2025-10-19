// controllers/appointment.controller.js
const { Sequelize } = require("sequelize");

const db = require("../models");
const Appointment = db.Appointment;
const Doctor = db.Doctor;
const User = db.User;
const Client = db.Client;
const jwt = require("jsonwebtoken");

exports.getAllAppointments = async (req, res) => {
	try {
		// Extract token from headers
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) {
			return res.status(401).json({ message: "No token provided" });
		}
		// Verify and decode token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		// Get userId from decoded token
		const userId = decoded.user_id; // depends on what you put inside the JWT payload
		// Fetch only appointments for this user
		console.log("Decoded Token:", decoded);
		const appointments = await Appointment.findAll({
			where: { user_id: userId },
			include: [
				{
					model: Doctor,
					as: "doctor",
					attributes: ["doctor_id", "first_name", "middle_name", "last_name"],
				},
			],
			order: [
				["date", "ASC"],
				["time", "ASC"],
			],
		});

		res.status(200).json(appointments);
	} catch (error) {
		console.error("Error fetching user appointments:", error);
		res.status(500).json({ message: "Something went wrong.", error });
	}
};

exports.getDoctorAppointments = async (req, res) => {
	try {
		const token = req.headers["authorization"]?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		// Find doctor linked to this user
		const doctor = await db.Doctor.findOne({ where: { user_id: userId } });
		if (!doctor)
			return res.status(403).json({ message: "No doctor found for this user" });

		const appointments = await db.Appointment.findAll({
			where: { doctor_id: doctor.doctor_id },
			include: [
				{
					model: db.Doctor,
					as: "doctor",
					attributes: ["doctor_id", "first_name", "middle_name", "last_name"],
				},
				{
					model: db.User,
					as: "user", // Appointment → User
					attributes: ["user_id", "email"],
					include: [
						{
							model: db.Client,
							as: "clients", // MUST match the alias in db.js
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
			],
			order: [
				["date", "ASC"],
				["time", "ASC"],
			],
		});

		res.status(200).json(appointments);
	} catch (error) {
		console.error("Error fetching doctor appointments:", error);
		res.status(500).json({ message: "Something went wrong.", error });
	}
};

exports.createAppointment = async (req, res) => {
	try {
		const { doctor_id, user_id, date, timeSlot, remarks } = req.body;

		if (!doctor_id || !user_id || !date || !timeSlot) {
			return res.status(400).json({ message: "Required fields are missing" });
		}

		// Convert timeSlot string to start time (example: "9:00 AM - 10:00 AM")
		const startTime = timeSlot.split(" - ")[0];
		const appointment = await Appointment.create({
			doctor_id,
			user_id,
			date,
			time: startTime,
			remarks,
			status: "Pending",
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
