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
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

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

exports.getDoctorDashboard = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token)
			return res.status(401).json({ message: "Authorization token missing." });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const isDoctor = await bcrypt.compare("doctor", decoded.role);

		if (!isDoctor) {
			return res.status(403).json({ message: "Access denied. Not a doctor." });
		}

		const doctorId = decoded.user_id;

		const today = new Date();
		const formattedDate = today.toISOString().split("T")[0];

		const [appointments, announcements, events, recentMessage, availabilities] =
			await Promise.all([
				Appointment.findAll({
					where: { doctor_id: doctorId, status: "Pending" },
					include: [
						{ model: User, as: "user" },
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
					where: { status: "upcoming" },
					order: [["date", "ASC"]],
					limit: 5,
				}),
				Message.findOne({
					where: { receiver_id: doctorId },
					include: [{ model: User, as: "sender" }],
					order: [["createdAt", "DESC"]],
				}),
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

// exports.getAllDoctors = async (req, res) => {
// 	try {
// 		const doctors = await Doctor.findAll({
// 			include: [
// 				{
// 					model: Field,
// 					as: "field",
// 					attributes: ["field_id", "name"],
// 				},
// 				{
// 					model: Appointment,
// 					as: "appointments",
// 					attributes: [
// 						"appointment_id",
// 						"user_id",
// 						"date",
// 						"time",
// 						"status",
// 						"remarks",
// 					],
// 				},
// 			],
// 			order: [["doctor_id", "ASC"]],
// 		});

// 		const formatted = doctors.map((doc) => ({
// 			name: `Dr. ${doc.first_name} ${
// 				doc.middle_name ? doc.middle_name + " " : ""
// 			}${doc.last_name}`,
// 			specialty: doc.field?.name || "General", // ✅ FIXED HERE TOO
// 			status:
// 				doc.status === "enabled"
// 					? "Active"
// 					: doc.status === "disabled"
// 					? "Inactive"
// 					: "Pending",
// 			imageUrl: doc.valid_id
// 				? `http://localhost:5000/uploads/${doc.valid_id}`
// 				: "https://picsum.photos/seed/defaultdoctor/200",
// 			appointments: doc.appointments.map((a) => ({
// 				withWhom: `User ${a.user_id}`,
// 				status: a.status,
// 				dateTime: `${a.date}T${a.time}`,
// 			})),
// 		}));

// 		res.status(200).json(formatted);
// 	} catch (error) {
// 		console.error("Error fetching doctors:", error);
// 		res.status(500).json({ message: "Failed to retrieve doctors.", error });
// 	}
// };

exports.getAllDoctors = async (req, res) => {
	try {
		const doctors = await Doctor.findAll({
			include: [
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
			imageUrl: doc.valid_id
				? `http://localhost:5000/uploads/${doc.valid_id}`
				: "https://picsum.photos/seed/defaultdoctor/200",
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
