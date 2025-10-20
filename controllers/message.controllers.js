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
const Admin = db.Admin;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { Op } = require("sequelize");

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

		await Notification.create({
			user_id: receiverUserId,
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

exports.sendMessageToAdmin = async (req, res) => {
	try {
		const token = req.headers.authorization.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const sender_id = decoded.user_id;

		const { type, content } = req.body;

		// 🧩 2. Find the admin from the Admin model
		const admin = await Admin.findOne();
		if (!admin) {
			return res
				.status(404)
				.json({ success: false, message: "Admin not found" });
		}

		const receiver_id = admin.user_id; // adjust field name if it's different (e.g. admin.id)
		// 📨 3. Create message record
		const msg = await Message.create({
			sender_id,
			receiver_id,
			type,
			content,
		});

		// 🔔 4. Notify the admin
		await Notification.create({
			user_id: receiver_id,
			type: "message",
			title: "New Message Received",
			message: "You have received a new message from a user.",
			related_id: msg.message_id,
		});

		res.json({ success: true, message: msg });
	} catch (err) {
		console.error("Error sending message to admin:", err);
		res.status(500).json({ success: false, error: err.message });
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

exports.getConversationAdmin = async (req, res) => {
	try {
		const token = req.headers.authorization.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user1 = decoded.user_id;

		// Get the admin’s user_id (assuming there's only one)
		const user2 = (await Admin.findOne()).user_id;

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

		// 🧠 Transform the response to include sender_role
		const formatted = msgs.map((msg) => ({
			message_id: msg.message_id,
			type: msg.type,
			content: msg.content,
			createdAt: msg.createdAt,
			read: msg.read,
			sender_id: msg.sender_id,
			receiver_id: msg.receiver_id,
			sender_role: msg.sender?.role, // ✅ added
			receiver_role: msg.receiver?.role, // optional
		}));

		res.json(formatted);
	} catch (err) {
		console.error("Error getting conversation:", err);
		res.status(500).json({ error: err.message });
	}
};

// exports.getConversationAdmin = async (req, res) => {
// 	try {
// 		const token = req.headers.authorization.split(" ")[1];
// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		const user1 = decoded.user_id;

// 		const user2 = (await Admin.findOne()).user_id;

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
// 		console.error("Error getting conversation:", err);
// 		res.status(500).json({ error: err.message });
// 	}

// };

// exports.getUsersWithConversations = async (req, res) => {
// 	try {
// 		// 🔐 Decode the JWT to get the logged-in admin user
// 		const token = req.headers.authorization?.split(" ")[1];
// 		if (!token) {
// 			return res.status(401).json({ message: "No token provided." });
// 		}

// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		const adminId = decoded.user_id;

// 		// 📨 Find all messages where admin is sender or receiver
// 		const messages = await Message.findAll({
// 			where: {
// 				[Op.or]: [{ sender_id: adminId }, { receiver_id: adminId }],
// 			},
// 			attributes: ["sender_id", "receiver_id", "content", "createdAt"],
// 			order: [["createdAt", "DESC"]],
// 		});

// 		// 🔍 Extract all unique user IDs that had a conversation with the admin
// 		const userIds = [
// 			...new Set(
// 				messages.map((msg) =>
// 					msg.sender_id === adminId ? msg.receiver_id : msg.sender_id
// 				)
// 			),
// 		];

// 		if (userIds.length === 0) {
// 			return res.json([]);
// 		}

// 		// 🧑‍💻 Fetch user details
// 		const users = await User.findAll({
// 			where: { user_id: { [Op.in]: userIds } },
// 			attributes: ["user_id", "email", "role"],
// 		});

// 		// 🧩 Combine with latest message info
// 		const convoList = users.map((user) => {
// 			const lastMsg = messages.find(
// 				(msg) =>
// 					msg.sender_id === user.user_id || msg.receiver_id === user.user_id
// 			);

// 			return {
// 				user_id: user.user_id,
// 				email: user.email,
// 				role: user.role,
// 				last_message: lastMsg ? lastMsg.content : null,
// 				last_time: lastMsg ? lastMsg.createdAt : null,
// 			};
// 		});

// 		res.json(convoList);
// 	} catch (err) {
// 		console.error("Error fetching user conversations:", err);
// 		res.status(500).json({ error: err.message });
// 	}
// };

exports.getUsersWithConversations = async (req, res) => {
	try {
		// 🔐 Decode JWT token to get logged-in admin
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided." });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const adminId = decoded.user_id;

		// 📨 Fetch all messages where admin is sender or receiver
		const messages = await Message.findAll({
			where: { [Op.or]: [{ sender_id: adminId }, { receiver_id: adminId }] },
			attributes: [
				"message_id",
				"sender_id",
				"receiver_id",
				"content",
				"createdAt",
			],
			order: [["createdAt", "DESC"]],
		});

		// 🔍 Extract all unique user IDs that had a conversation with the admin
		const userIds = [
			...new Set(
				messages.map((msg) =>
					msg.sender_id === adminId ? msg.receiver_id : msg.sender_id
				)
			),
		];

		if (userIds.length === 0) return res.json([]);

		// 🧑‍💻 Fetch user details
		const users = await User.findAll({
			where: { user_id: { [Op.in]: userIds } },
			attributes: ["user_id", "email", "role", "profile_picture"],
		});

		// 🧩 Combine with latest message info
		const convoList = users.map((user) => {
			const lastMsg = messages.find(
				(msg) =>
					msg.sender_id === user.user_id || msg.receiver_id === user.user_id
			);

			return {
				conversation_user_id: user.user_id, // user chatting with admin
				sender_id: lastMsg ? lastMsg.sender_id : null,
				receiver_id: lastMsg ? lastMsg.receiver_id : null,
				email: user.email,
				role: user.role,
				profile_picture: user.profile_picture,
				last_message: lastMsg ? lastMsg.content : null,
				last_time: lastMsg ? lastMsg.createdAt : null,
			};
		});

		res.json(convoList);
	} catch (err) {
		console.error("Error fetching user conversations:", err);
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
