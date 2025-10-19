const db = require("../models");
const Client = db.Client;
const User = db.User;
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.getAllClients = async (req, res) => {
	try {
		const clients = await Client.findAll({
			include: [
				{
					model: User,
					as: "user",
					attributes: ["user_id", "email", "status", "role"],
				},
			],
			order: [["client_id", "ASC"]],
		});

		// Format response
		const formatted = clients.map((c) => ({
			id: c.client_id,
			name: `${c.first_name} ${c.middle_name ? c.middle_name + " " : ""}${
				c.last_name
			}`,
			email: c.user?.email || "N/A",
			contact: c.contact_number,
			status:
				c.status === "enabled"
					? "Active"
					: c.status === "disabled"
					? "Inactive"
					: "Pending",
			role: c.user?.role || "client",
			createdAt: c.createdAt,
		}));

		res.status(200).json(formatted);
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
