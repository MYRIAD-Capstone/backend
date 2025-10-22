const jwt = require("jsonwebtoken");
const { User, Admin } = require("../models");
require("dotenv").config();

exports.updateAdminProfile = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1]; // Expect "Bearer <token>"

		if (!token) {
			return res.status(401).json({ message: "Authorization token missing." });
		}

		// Decode token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		const { email, first_name, middle_name, last_name, contact_number } =
			req.body;

		// Update User email
		await User.update({ email }, { where: { user_id: userId } });

		// Find Admin profile
		const admin = await Admin.findOne({ where: { user_id: userId } });
		if (!admin) return res.status(404).json({ message: "Admin not found" });

		// Update Admin profile
		await admin.update({
			first_name,
			middle_name,
			last_name,
			contact_number,
		});

		res.json({ message: "Admin profile updated successfully" });
	} catch (err) {
		console.error("Error updating admin profile:", err);
		res.status(500).json({ message: "Server error" });
	}
};

exports.getAdminProfile = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1]; // Expect "Bearer <token>"

		if (!token) {
			return res.status(401).json({ message: "Authorization token missing." });
		}

		const admin = await Admin.findOne();

		if (!admin) {
			return res.status(404).json({ message: "Admin profile not found." });
		}

		res.json({ admin });
	} catch (err) {
		console.error("Error fetching admin profile:", err);
		res.status(500).json({ message: "Server error" });
	}
};
