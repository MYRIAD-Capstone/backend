const db = require("../models");
const Doctor = db.Doctor;
const Event = db.Event;
const Message = db.Message;
require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.getCounts = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.user_id;

		const doctorCount = await Doctor.count();
		const eventCount = await Event.count();
		console.log("User ID from token:", userId);
		// 🔹 Get unread message count for this user
		let unreadMessages = 0;
		if (userId) {
			unreadMessages = await Message.count({
				where: {
					receiver_id: userId,
					read: false,
				},
			});
		}

		res.status(200).json({
			doctorCount,
			eventCount,
			unreadMessages,
		});
	} catch (error) {
		console.error("Error fetching counts:", error);
		res.status(500).json({ message: "Something went wrong.", error });
	}
};
