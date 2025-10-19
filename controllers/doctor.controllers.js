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

exports.createAvailability = async (req, res) => {
	try {
		const { doctor_id, date, start_time, end_time, status } = req.body;
		// Basic validation
		if (!doctor_id || !date || !start_time || !end_time) {
			return res.status(400).json({ message: "Missing required fields" });
		}
		const availability = await DoctorAvailability.create({
			doctor_id,
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
		const { doctorId, date } = req.query; // 👈 from query
		console.log(
			"Fetching availability for doctorId:",
			doctorId,
			"on date:",
			date
		);
		if (!doctorId || !date) {
			return res
				.status(400)
				.json({ message: "doctorId and date are required" });
		}
		const slots = await DoctorAvailability.findAll({
			where: { doctor_id: doctorId, date },
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
		// 1️⃣ Get token from headers
		const token = req.headers.authorization?.split(" ")[1];
		if (!token)
			return res.status(401).json({ message: "Authorization token missing." });

		// 2️⃣ Decode token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log("Decoded JWT:", decoded);

		// 3️⃣ Compare role using bcrypt (if stored encrypted)
		const isDoctor = await bcrypt.compare("doctor", decoded.role);
		if (!isDoctor) {
			return res.status(403).json({ message: "Access denied. Not a doctor." });
		}

		const doctorId = decoded.user_id;

		// 4️⃣ Get today's date in YYYY-MM-DD format
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
		const dd = String(today.getDate()).padStart(2, "0");
		const formattedDate = `${yyyy}-${mm}-${dd}`;

		// 5️⃣ Fetch data in parallel
		const [appointments, announcements, events, recentMessage, availabilities] =
			await Promise.all([
				Appointment.findAll({
					where: { doctor_id: doctorId, status: "Approved" },
					include: [
						{
							model: User,
							as: "user",
						},
					],
					order: [
						["date", "ASC"],
						["time", "ASC"],
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
					include: [
						{
							model: User,
							as: "sender",
						},
					],
					order: [["createdAt", "DESC"]],
				}),
				DoctorAvailability.findAll({
					where: { doctor_id: doctorId, date: formattedDate },
					order: [["start_time", "ASC"]],
				}),
			]);

		// 6️⃣ Return dashboard data
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

exports.getAllDoctors = async (req, res) => {
	try {
		const doctors = await Doctor.findAll({
			include: [
				{
					model: Field,
					as: "field",
					attributes: ["field_id", "name"], // ✅ FIXED: use "name" not "field_name"
				},
				{
					model: Appointment,
					as: "appointments",
					attributes: [
						"appointment_id",
						"user_id",
						"date",
						"time",
						"status",
						"remarks",
					],
				},
			],
			order: [["doctor_id", "ASC"]],
		});

		const formatted = doctors.map((doc) => ({
			name: `Dr. ${doc.first_name} ${
				doc.middle_name ? doc.middle_name + " " : ""
			}${doc.last_name}`,
			specialty: doc.field?.name || "General", // ✅ FIXED HERE TOO
			status:
				doc.status === "enabled"
					? "Active"
					: doc.status === "disabled"
					? "Inactive"
					: "Pending",
			imageUrl: doc.valid_id
				? `http://localhost:5000/uploads/${doc.valid_id}`
				: "https://picsum.photos/seed/defaultdoctor/200",
			appointments: doc.appointments.map((a) => ({
				withWhom: `User ${a.user_id}`,
				status: a.status,
				dateTime: `${a.date}T${a.time}`,
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

// exports.updateDoctorProfile = async (req, res) => {
// 	try {
// 		const token = req.headers.authorization?.split(" ")[1];
// 		if (!token)
// 			return res.status(401).send({ message: "Authorization token missing." });

// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		const userId = decoded.user_id;
// 		console.log("Decoded JWT for profile update:", decoded);

// 		const {
// 			email,
// 			first_name,
// 			middle_name,
// 			last_name,
// 			contact_number,
// 			valid_id,
// 			field_id,
// 		} = req.body;

// 		// Update email if provided
// 		if (email) {
// 			await User.update({ email }, { where: { user_id: userId } });
// 		}

// 		// Update doctor profile
// 		const [updateCount, updatedDoctor] = await Doctor.update(
// 			{
// 				first_name,
// 				middle_name,
// 				last_name,
// 				contact_number,
// 				valid_id,
// 				field_id,
// 			},
// 			{ where: { user_id: userId }, returning: true }
// 		);

// 		if (updateCount === 0)
// 			return res.status(404).send({ message: "Doctor profile not found." });

// 		res.status(200).send({
// 			message: "Profile updated successfully!",
// 			data: updatedDoctor[0],
// 		});
// 	} catch (error) {
// 		console.error("Error during profile update:", error);

// 		if (error.name === "SequelizeUniqueConstraintError") {
// 			return res.status(409).send({ message: "Email is already in use." });
// 		}

// 		res
// 			.status(500)
// 			.send({ message: "Failed to update profile.", error: error.message });
// 	}
// };

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
