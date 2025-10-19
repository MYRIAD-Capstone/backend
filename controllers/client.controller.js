const db = require("../models");
const Client = db.Client;
const User = db.User;

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
