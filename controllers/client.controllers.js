const db = require("../models");
const Client = db.Client;
const User = db.User;
const Appointment = db.Appointment;
const Doctor = db.Doctor;
const DoctorAvailability = db.DoctorAvailability;
const { format } = require("date-fns"); // npm install date-fns
require("dotenv").config();

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
