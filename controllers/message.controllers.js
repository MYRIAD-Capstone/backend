// // controllers/message.controller.js
// const db = require("../models");
// const Message = db.Message;
// const User = db.User;

// exports.sendMessageClient = async (req, res) => {
// 	try {
// 		const { sender_id, receiver_id, type, content } = req.body;
// 		//get the user id using the receiver_id which is doctor_id
// 		const doctor = await User.findByPk(receiver_id);
// 		if (!doctor) {
// 			return res.status(404).json({ error: "Doctor not found" });
// 		}
// 		//set receiver_id to the user_id of the doctor
// 		const receiverUserId = doctor.user_id;
// 		const msg = await Message.create({
// 			sender_id,
// 			receiver_id: receiverUserId,
// 			type,
// 			content,
// 		});
// 		res.json({ success: true, message: msg });
// 	} catch (err) {
// 		res.status(500).json({ error: err.message });
// 	}
// };

// exports.sendMessageDoctor = async (req, res) => {
// 	try {
// 		const { sender_id, receiver_id, type, content } = req.body;
// 		const msg = await Message.create({ sender_id, receiver_id, type, content });

// 		res.json({ success: true, message: msg });
// 	} catch (err) {
// 		res.status(500).json({ error: err.message });
// 	}
// };

// exports.getConversation = async (req, res) => {
// 	try {
// 		const { user1, user2 } = req.params;

// 		const msgs = await Message.findAll({
// 			where: {
// 				[db.Sequelize.Op.or]: [
// 					{ sender_id: user1, receiver_id: user2 },
// 					{ sender_id: user2, receiver_id: user1 },
// 				],
// 			},
// 			order: [["createdAt", "ASC"]],
// 			include: [
// 				{ model: User, as: "sender", attributes: ["user_id", "email", "role"] },
// 				{
// 					model: User,
// 					as: "receiver",
// 					attributes: ["user_id", "email", "role"],
// 				},
// 			],
// 		});

// 		res.json(msgs);
// 	} catch (err) {
// 		res.status(500).json({ error: err.message });
// 	}
// };

// exports.markAsRead = async (req, res) => {
// 	try {
// 		const { messageId } = req.params;
// 		await Message.update({ read: true }, { where: { message_id: messageId } });
// 		res.json({ success: true });
// 	} catch (err) {
// 		res.status(500).json({ error: err.message });
// 	}
// };

// controllers/message.controller.js
const db = require("../models");
const Message = db.Message;
const User = db.User;
const Notification = db.Notification;

exports.sendMessageClient = async (req, res) => {
	try {
		const { sender_id, receiver_id, type, content } = req.body;
		//get the user id using the receiver_id which is doctor_id
		const doctor = await User.findByPk(receiver_id);
		if (!doctor) {
			return res.status(404).json({ error: "Doctor not found" });
		}
		//set receiver_id to the user_id of the doctor
		const receiverUserId = doctor.user_id;

		// Create message
		const msg = await Message.create({
			sender_id,
			receiver_id: receiverUserId,
			type,
			content,
		});

		// ✅ Create notification for the receiver (doctor)
		await Notification.create({
			user_id: receiverUserId, // receiver of the message
			type: "message",
			title: "New Message Received",
			message: `You have received a new message from a client.`,
			related_id: msg.message_id,
		});

		res.json({ success: true, message: msg });
	} catch (err) {
		console.error("Error sending client message:", err);
		res.status(500).json({ error: err.message });
	}
};

exports.sendMessageDoctor = async (req, res) => {
	try {
		const { sender_id, receiver_id, type, content } = req.body;
		const msg = await Message.create({ sender_id, receiver_id, type, content });

		// ✅ Create notification for the receiver (client)
		await Notification.create({
			user_id: receiver_id,
			type: "message",
			title: "New Message Received",
			message: `You have received a new message from your doctor.`,
			related_id: msg.message_id,
		});

		res.json({ success: true, message: msg });
	} catch (err) {
		console.error("Error sending doctor message:", err);
		res.status(500).json({ error: err.message });
	}
};

exports.getConversation = async (req, res) => {
	try {
		const { user1, user2 } = req.params;

		const msgs = await Message.findAll({
			where: {
				[db.Sequelize.Op.or]: [
					{ sender_id: user1, receiver_id: user2 },
					{ sender_id: user2, receiver_id: user1 },
				],
			},
			order: [["createdAt", "ASC"]],
			include: [
				{ model: User, as: "sender", attributes: ["user_id", "email", "role"] },
				{
					model: User,
					as: "receiver",
					attributes: ["user_id", "email", "role"],
				},
			],
		});

		res.json(msgs);
	} catch (err) {
		console.error("Error getting conversation:", err);
		res.status(500).json({ error: err.message });
	}
};

exports.markAsRead = async (req, res) => {
	try {
		const { messageId } = req.params;

		await Message.update({ read: true }, { where: { message_id: messageId } });

		// (Optional) Mark related notification as read too
		await Notification.update(
			{ is_read: true },
			{ where: { related_id: messageId, type: "message" } }
		);

		res.json({ success: true });
	} catch (err) {
		console.error("Error marking message as read:", err);
		res.status(500).json({ error: err.message });
	}
};
