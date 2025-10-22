const db = require("../models");
const Doctor = db.Doctor;
const Event = db.Event;
const Message = db.Message;

exports.getCounts = async (req, res) => {
	try {
		const userId = req.user?.id; // 👈 decoded from JWT in middleware

		const doctorCount = await Doctor.count();
		const eventCount = await Event.count();

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
