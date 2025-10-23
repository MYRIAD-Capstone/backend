const db = require("../models");
const DoctorAvailability = db.DoctorAvailability;
4;
const Doctor = db.Doctor;
const Field = db.Field;
const Appointment = db.Appointment;
const Article = db.Article;
const Event = db.Event;
const Message = db.Message;
const User = db.User;
const Client = db.Client;
const Admin = db.Admin;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

exports.getDoctorStats = async (req, res) => {
	try {
		const total = await Doctor.count();
		const active = await Doctor.count({ where: { status: "enabled" } });
		const pending = await Doctor.count({ where: { status: "pending" } });
		const disabled = await Doctor.count({ where: { status: "disabled" } });

		res.status(200).json({
			total,
			active,
			pending,
			disabled,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

exports.getAvailableTimeByDoctor = async (req, res) => {
	try {
		const { doctor_id, date } = req.query;

		// Basic validation
		if (!doctor_id || !date) {
			return res
				.status(400)
				.json({ message: "Both doctor_id and date are required." });
		}

		// Fetch all available time slots for the doctor on that date
		const slots = await DoctorAvailability.findAll({
			where: { doctor_id, date, status: "available" },
			order: [["start_time", "ASC"]],
			attributes: [
				"availability_id",
				"start_time",
				"end_time",
				"status",
				"date",
			],
		});

		if (!slots || slots.length === 0) {
			return res.status(404).json({
				message:
					"No available time slots found for this doctor on the given date.",
			});
		}

		// Format each slot into readable strings
		const formattedSlots = slots.map((slot) => ({
			availability_id: slot.availability_id,
			start_time: slot.start_time,
			end_time: slot.end_time,
			time_slot: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(
				0,
				5
			)}`,
			date: slot.date,
			status: slot.status,
		}));

		return res.status(200).json({ slots: formattedSlots });
	} catch (error) {
		console.error("Error fetching doctor availability:", error);
		return res
			.status(500)
			.json({ message: "Server error", error: error.message });
	}
};

exports.createAvailability = async (req, res) => {
	try {
		const { date, start_time, end_time, status } = req.body;
		// Basic validation
		const token = req.headers.authorization?.split(" ")[1];
		if (!token)
			return res.status(401).json({ message: "Authorization token missing." });
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		//get doctor id from Doctor table using user_id from decoded token
		const doctor = await Doctor.findOne({
			where: { user_id: decoded.user_id },
		});
		if (!doctor || !date || !start_time || !end_time) {
			return res.status(400).json({ message: "Missing required fields" });
		}
		const availability = await DoctorAvailability.create({
			doctor_id: doctor.doctor_id,
			date,
			start_time,
			end_time,
			status: status || "available",
		});
		return res.status(201).json({
			message: "Availability created successfully",
			availability,
		});
	} catch (err) {
		console.error("Error creating availability:", err);
		return res
			.status(500)
			.json({ message: "Server error", error: err.message });
	}
};

exports.getAvailabilitiesByDoctor = async (req, res) => {
	try {
		const { date } = req.query;

		// 1️⃣ Get token from headers
		const token = req.headers.authorization?.split(" ")[1];
		if (!token)
			return res.status(401).json({ message: "Authorization token missing." });
		// 2️⃣ Decode token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		//get doctor id from Doctor table using user_id from decoded token
		const doctor = await Doctor.findOne({
			where: { user_id: decoded.user_id },
		});

		if (!doctor || !date) {
			return res
				.status(400)
				.json({ message: "Doctor not found or date not provided." });
		}
		const slots = await DoctorAvailability.findAll({
			where: { doctor_id: doctor.doctor_id, date },
			order: [["start_time", "ASC"]],
		});

		return res.status(200).json({ slots });
	} catch (err) {
		console.error("Error fetching availability:", err);
		return res
			.status(500)
			.json({ message: "Server error", error: err.message });
	}
};

// exports.getDoctorDashboard = async (req, res) => {
// 	try {
// 		const token = req.headers.authorization?.split(" ")[1];
// 		if (!token)
// 			return res.status(401).json({ message: "Authorization token missing." });

// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);

// 		const isDoctor = await bcrypt.compare("doctor", decoded.role);

// 		if (!isDoctor) {
// 			return res.status(403).json({ message: "Access denied. Not a doctor." });
// 		}

// 		const doctorId = await Doctor.findOne({
// 			where: { user_id: decoded.user_id },
// 		}).then((doc) => doc.doctor_id);

// 		const today = new Date();
// 		const formattedDate = today.toISOString().split("T")[0];

// 		const [appointments, announcements, events, recentMessage, availabilities] =
// 			await Promise.all([
// 				Appointment.findAll({
// 					where: { doctor_id: doctorId, status: "Pending" },
// 					include: [
// 						{
// 							model: User,
// 							as: "user",
// 							attributes: ["user_id", "email"],
// 							include: [
// 								{
// 									model: Client,
// 									as: "clients", // <-- must match your association alias
// 									attributes: ["first_name", "last_name"],
// 								},
// 							],
// 						},
// 						{
// 							model: DoctorAvailability,
// 							as: "availability",
// 							attributes: ["start_time", "end_time"],
// 						},
// 					],
// 					order: [
// 						["date", "ASC"],
// 						[
// 							{ model: DoctorAvailability, as: "availability" },
// 							"start_time",
// 							"ASC",
// 						],
// 					],
// 					limit: 5,
// 				}),

// 				Article.findAll({
// 					where: { status: "published" },
// 					order: [["createdAt", "DESC"]],
// 					limit: 3,
// 				}),
// 				Event.findAll({
// 					order: [["date", "ASC"]],
// 					limit: 5,
// 				}),
// 				Message.findOne({
// 					where: { receiver_id: decoded.user_id },
// 					include: [{ model: User, as: "sender" }],
// 					order: [["createdAt", "DESC"]],
// 				}),
// 				DoctorAvailability.findAll({
// 					where: { doctor_id: doctorId, date: formattedDate },
// 					order: [["start_time", "ASC"]],
// 				}),
// 			]);

// 		return res.status(200).json({
// 			message: "Doctor dashboard fetched successfully",
// 			appointments,
// 			announcements,
// 			events,
// 			recentMessage: recentMessage || {},
// 			availabilities,
// 		});
// 	} catch (error) {
// 		console.error("Error fetching doctor dashboard:", error);
// 		return res.status(500).json({
// 			message: "Failed to fetch doctor dashboard.",
// 			error: error.message,
// 		});
// 	}
// };

exports.getDoctorDashboard = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token)
			return res.status(401).json({ message: "Authorization token missing." });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const doctor = await Doctor.findOne({
			where: { user_id: decoded.user_id },
		});
		if (!doctor) {
			return res.status(403).json({ message: "Access denied. Not a doctor." });
		}
		const doctorId = doctor.doctor_id;

		const today = new Date();
		const formattedDate = today.toISOString().split("T")[0];

		// Fetch everything in parallel
		const [appointments, announcements, events, recentMessage, availabilities] =
			await Promise.all([
				Appointment.findAll({
					where: { doctor_id: doctorId, status: "Pending" },
					include: [
						{
							model: User,
							as: "user",
							attributes: ["user_id", "email", "role"],
							include: [
								{
									model: Client,
									as: "clients",
									attributes: ["first_name", "last_name"],
								},
							],
						},
						{
							model: DoctorAvailability,
							as: "availability",
							attributes: ["start_time", "end_time"],
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

				Article.findAll({
					where: { status: "published" },
					order: [["createdAt", "DESC"]],
					limit: 3,
				}),

				Event.findAll({
					order: [["date", "ASC"]],
					limit: 5,
				}),

				// Fetch latest message and include personal info based on role
				(async () => {
					const msg = await Message.findOne({
						where: { receiver_id: decoded.user_id },
						include: [
							{
								model: User,
								as: "receiver",
								attributes: ["user_id", "email", "role"],
							},
							{
								model: User,
								as: "sender",
								attributes: ["user_id", "email", "role"],
							},
						],
						order: [["createdAt", "DESC"]],
					});

					if (!msg) return null;

					// Add personal info dynamically based on sender role
					const sender = msg.sender;
					let personalInfo = null;

					switch (sender.role) {
						case "client":
							personalInfo = await Client.findOne({
								where: { user_id: sender.user_id },
								attributes: ["first_name", "last_name"],
							});
							break;
						case "admin":
							personalInfo = await Admin.findOne({
								where: { user_id: sender.user_id },
								attributes: ["first_name", "last_name"],
							});
							break;
						case "doctor":
							personalInfo = await Doctor.findOne({
								where: { user_id: sender.user_id },
								attributes: ["first_name", "last_name", "specialty"],
							});
							break;
					}

					msg.sender.personalInfo = personalInfo;
					return msg;
				})(),

				DoctorAvailability.findAll({
					where: { doctor_id: doctorId, date: formattedDate },
					order: [["start_time", "ASC"]],
				}),
			]);

		return res.status(200).json({
			message: "Doctor dashboard fetched successfully",
			appointments,
			announcements,
			events,
			recentMessage: recentMessage || {},
			availabilities,
		});
	} catch (error) {
		console.error("Error fetching doctor dashboard:", error);
		return res.status(500).json({
			message: "Failed to fetch doctor dashboard.",
			error: error.message,
		});
	}
};

exports.getDoctorAppointments = async (req, res) => {
	try {
		// 🔐 1️⃣ Extract and verify token
		const token = req.headers.authorization?.split(" ")[1];
		if (!token)
			return res.status(401).json({ message: "Authorization token missing." });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// 🩺 2️⃣ Get doctor from user_id
		const doctor = await Doctor.findOne({
			where: { user_id: decoded.user_id },
		});
		if (!doctor)
			return res.status(404).json({ message: "Doctor profile not found." });

		const doctor_id = doctor.doctor_id;

		// 📅 3️⃣ Fetch all appointments for this doctor
		const appointments = await Appointment.findAll({
			where: { doctor_id },
			include: [
				{
					model: User,
					as: "patient",
					attributes: ["user_id", "first_name", "last_name", "email"],
				},
				{
					model: DoctorAvailability,
					as: "availability",
					attributes: ["date", "start_time", "end_time", "status"],
				},
			],
			order: [["createdAt", "DESC"]],
		});

		// 🚫 4️⃣ Handle empty result
		if (!appointments.length) {
			return res
				.status(404)
				.json({ message: "No appointments found for this doctor." });
		}

		// ✅ 5️⃣ Return result
		return res.status(200).json({ appointments });
	} catch (error) {
		console.error("Error fetching doctor appointments:", error);
		return res.status(500).json({
			message: "Server error while fetching appointments.",
			error: error.message,
		});
	}
};

exports.getAllDoctors = async (req, res) => {
	try {
		const doctors = await Doctor.findAll({
			include: [
				{
					model: User,
					as: "user",
					attributes: ["user_id", "email", "status", "role", "profile_picture"],
				},
				{
					model: Field,
					as: "field",
					attributes: ["field_id", "name"],
				},
				{
					model: DoctorAvailability,
					as: "availabilities",
					attributes: [
						"availability_id",
						"date",
						"start_time",
						"end_time",
						"status",
					],
				},
			],
			order: [["doctor_id", "ASC"]],
		});

		const formatted = doctors.map((doc) => ({
			user_id: doc.user_id,
			doctor_id: doc.doctor_id,
			name: `Dr. ${doc.first_name} ${
				doc.middle_name ? doc.middle_name + " " : ""
			}${doc.last_name}`,
			specialty: doc.field?.name || "General",
			status:
				doc.status === "enabled"
					? "Active"
					: doc.status === "disabled"
					? "Inactive"
					: "Pending",
			imageUrl: doc.user.profile_picture,
			availability: doc.availabilities.map((a) => ({
				date: a.date,
				startTime: a.start_time,
				endTime: a.end_time,
				status: a.status,
			})),
		}));

		res.status(200).json(formatted);
	} catch (error) {
		console.error("Error fetching doctors:", error);
		res.status(500).json({ message: "Failed to retrieve doctors.", error });
	}
};

exports.getDoctorById = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token)
			return res.status(401).json({ message: "Authorization token missing." });
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const isDoctor = decoded.role === "doctor";

		if (!isDoctor) {
			return res.status(403).json({ message: "Access denied. Not a doctor." });
		}
		const user_id = decoded.user_id;
		const doctor = await Doctor.findOne({
			where: { user_id: user_id },
		});

		if (!doctor) {
			// This means the user is authenticated as a doctor but hasn't created their profile yet
			return res.status(404).json({ message: "Doctor profile not found." });
		}

		return res.status(200).json({ doctor });
	} catch (error) {
		// Handle JWT errors (expired, invalid signature) and other server/DB errors
		console.error("Error fetching doctor:", error);
		return res
			.status(500)
			.json({ message: "Server error", error: error.message });
	}
};

exports.updateDoctorProfile = async (req, res) => {
	const MAX_RETRIES = 3; // number of retry attempts
	const RETRY_DELAY = 100; // ms delay between retries

	const token = req.headers.authorization?.split(" ")[1];
	if (!token)
		return res.status(401).send({ message: "Authorization token missing." });

	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	const userId = decoded.user_id;
	console.log("Decoded JWT for profile update:", decoded);

	const {
		email,
		first_name,
		middle_name,
		last_name,
		contact_number,
		valid_id,
		field_id,
	} = req.body;

	let attempt = 0;

	while (attempt < MAX_RETRIES) {
		try {
			// Update email if provided
			if (email) {
				await User.update({ email }, { where: { user_id: userId } });
			}

			// Update doctor profile
			const [updateCount, updatedDoctor] = await Doctor.update(
				{
					first_name,
					middle_name,
					last_name,
					contact_number,
					valid_id,
					field_id,
				},
				{ where: { user_id: userId }, returning: true }
			);

			if (updateCount === 0)
				return res.status(404).send({ message: "Doctor profile not found." });

			return res.status(200).send({
				message: "Profile updated successfully!",
				data: updatedDoctor[0],
			});
		} catch (error) {
			console.error(`Attempt ${attempt + 1} failed:`, error.message);

			// Retry only on transient connection errors
			if (
				(error.parent && error.parent.code === "ECONNRESET") ||
				error.message.includes("ECONNRESET")
			) {
				attempt++;
				if (attempt < MAX_RETRIES) {
					console.log(`Retrying in ${RETRY_DELAY}ms...`);
					await new Promise((r) => setTimeout(r, RETRY_DELAY));
					continue;
				}
			}

			// Handle unique email constraint
			if (error.name === "SequelizeUniqueConstraintError") {
				return res.status(409).send({ message: "Email is already in use." });
			}

			// General error fallback
			return res
				.status(500)
				.send({ message: "Failed to update profile.", error: error.message });
		}
	}
};

exports.setUnavailable = async (req, res) => {
	try {
		const { availability_id } = req.params;

		const availability = await DoctorAvailability.findByPk(availability_id);

		if (!availability) {
			return res.status(404).json({ message: "Availability not found" });
		}

		availability.status = "unavailable";
		await availability.save();

		res.status(200).json({
			message: "Doctor availability set to unavailable",
			availability,
		});
	} catch (error) {
		console.error("Error updating doctor availability:", error);
		res.status(500).json({
			message: "Failed to update availability",
			error: error.message,
		});
	}
};

exports.deleteAvailability = async (req, res) => {
	try {
		const { availability_id } = req.params;

		const availability = await DoctorAvailability.findByPk(availability_id);
		if (!availability) {
			return res.status(404).json({ message: "Availability not found" });
		}

		// Check if any appointment exists for this availability
		const existingAppointment = await Appointment.findOne({
			where: { availability_id },
		});

		if (existingAppointment) {
			return res.status(400).json({
				message:
					"Cannot delete availability because there are appointments scheduled.",
			});
		}

		// Safe to delete
		await availability.destroy();

		res.status(200).json({ message: "Availability deleted successfully" });
	} catch (error) {
		console.error("Error deleting availability:", error);
		res.status(500).json({
			message: "Failed to delete availability",
			error: error.message,
		});
	}
};
