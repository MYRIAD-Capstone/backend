const db = require("../models");
const Client = db.Client;
const User = db.User;
const Appointment = db.Appointment;
const Doctor = db.Doctor;
const DoctorAvailability = db.DoctorAvailability;
const { format } = require("date-fns");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { Event, Article, Message } = db;
const bcrypt = require("bcrypt");

// exports.getClientDashboard = async (req, res) => {
// 	try {
// 		const token = req.headers.authorization?.split(" ")[1];
// 		if (!token)
// 			return res.status(401).json({ message: "Authorization token missing." });

// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);

// 		const userId = decoded.user_id;
// 		const today = new Date().toISOString().split("T")[0];

// 		const [
// 			upcomingAppointments,
// 			recentArticles,
// 			upcomingEvents,
// 			recentMessage,
// 		] = await Promise.all([
// 			// 🩺 Appointments
// 			Appointment.findAll({
// 				where: { user_id: userId, status: "Pending" },
// 				include: [
// 					{
// 						model: Doctor,
// 						as: "doctor",
// 					},
// 					{
// 						model: DoctorAvailability,
// 						as: "availability",
// 						attributes: ["date", "start_time", "end_time"],
// 					},
// 				],
// 				order: [
// 					["date", "ASC"],
// 					[
// 						{ model: DoctorAvailability, as: "availability" },
// 						"start_time",
// 						"ASC",
// 					],
// 				],
// 				limit: 5,
// 			}),

// 			// 📰 Articles
// 			Article.findAll({
// 				where: { status: "published" },
// 				order: [["createdAt", "DESC"]],
// 				limit: 3,
// 			}),

// 			// 📅 Events
// 			Event.findAll({
// 				where: { status: "upcoming" },
// 				order: [["date", "ASC"]],
// 				limit: 5,
// 			}),

// 			Message.findOne({
// 				where: { receiver_id: userId },
// 				include: [
// 					{
// 						model: User,
// 						as: "sender",
// 					},
// 				],
// 				order: [["createdAt", "DESC"]],
// 			}),
// 		]);

// 		return res.status(200).json({
// 			message: "Client dashboard fetched successfully.",
// 			today,
// 			upcomingAppointments,
// 			recentArticles,
// 			upcomingEvents,
// 			recentMessage: recentMessage || {},
// 		});
// 	} catch (error) {
// 		console.error("Error fetching client dashboard:", error);
// 		return res.status(500).json({
// 			message: "Failed to fetch client dashboard.",
// 			error: error.message,
// 		});
// 	}
// };

exports.getClientDashboard = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token)
			return res.status(401).json({ message: "Authorization token missing." });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;
		const today = new Date().toISOString().split("T")[0];

		const [
			upcomingAppointments,
			recentArticles,
			upcomingEvents,
			recentMessage,
		] = await Promise.all([
			// 🩺 Appointments
			Appointment.findAll({
				where: { user_id: userId, status: "Pending" },
				include: [
					{
						model: Doctor,
						as: "doctor",
					},
					{
						model: DoctorAvailability,
						as: "availability",
						attributes: ["date", "start_time", "end_time"],
					},
				],
				order: [
					["date", "ASC"],
					[
						{ model: DoctorAvailability, as: "availability" },
						"start_time",
						"ASC",
					],
				],
				limit: 5,
			}),

			// 📰 Articles
			Article.findAll({
				where: { status: "published" },
				order: [["createdAt", "DESC"]],
				limit: 3,
			}),

			// 📅 Events
			Event.findAll({
				where: { status: "upcoming" },
				order: [["date", "ASC"]],
				limit: 5,
			}),

			// 💬 Most recent message received by the user
			Message.findOne({
				where: { receiver_id: userId },
				include: [{ model: User, as: "sender" }],
				order: [["createdAt", "DESC"]],
			}),
		]);

		let enrichedMessage = {};

		// 🧠 If there’s a recent message, identify sender’s role and name
		if (recentMessage) {
			const senderUserId = recentMessage.sender.user_id;
			const senderRole = recentMessage.sender.role; // assuming User model has 'role'

			let senderName = "Unknown";

			if (senderRole === "admin") {
				const admin = await Admin.findOne({ where: { user_id: senderUserId } });
				if (admin) senderName = `${admin.first_name} ${admin.last_name}`;
			} else if (senderRole === "doctor") {
				const doctor = await Doctor.findOne({
					where: { user_id: senderUserId },
				});
				if (doctor) senderName = `${doctor.first_name} ${doctor.last_name}`;
			}

			enrichedMessage = {
				...recentMessage.toJSON(),
				senderRole,
				senderName,
			};
		}

		return res.status(200).json({
			message: "Client dashboard fetched successfully.",
			today,
			upcomingAppointments,
			recentArticles,
			upcomingEvents,
			recentMessage: enrichedMessage,
		});
	} catch (error) {
		console.error("Error fetching client dashboard:", error);
		return res.status(500).json({
			message: "Failed to fetch client dashboard.",
			error: error.message,
		});
	}
};

exports.getAllClients = async (req, res) => {
	try {
		const clients = await Client.findAll({
			include: [
				{
					model: User,
					as: "user",
					attributes: ["user_id", "email", "status", "role"],
					include: [
						{
							model: Appointment,
							as: "appointments",
							include: [
								{
									model: Doctor,
									as: "doctor",
									attributes: ["doctor_id", "first_name", "last_name"],
								},
								{
									model: DoctorAvailability,
									as: "availability",
									attributes: [
										"availability_id",
										"start_time",
										"end_time",
										"date",
										"status",
									],
								},
							],
						},
					],
				},
			],
			order: [["client_id", "ASC"]],
		});

		res.status(200).json(clients);
	} catch (error) {
		console.error("Error fetching clients:", error);
		res.status(500).json({
			message: "Failed to retrieve clients.",
			error: error.message,
		});
	}
};

exports.updateProfile = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1]; // Expect "Bearer <token>"

		if (!token) {
			return res.status(401).json({ message: "Authorization token missing." });
		}

		// Decode token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		const {
			email,
			first_name,
			middle_name,
			last_name,
			contact_number,
			field_id,
		} = req.body;

		// Update User email
		await User.update({ email }, { where: { user_id: userId } });

		// Update Client profile
		const client = await Client.findOne({ where: { user_id: userId } });
		if (!client) return res.status(404).json({ message: "Client not found" });

		await client.update({
			first_name,
			middle_name,
			last_name,
			contact_number,
			field_id,
		});

		res.json({ message: "Profile updated successfully" });
	} catch (err) {
		console.error("Error updating profile:", err);
		res.status(500).json({ message: "Server error" });
	}
};
