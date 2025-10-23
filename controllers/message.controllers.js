const db = require("../models");
const Message = db.Message;
const User = db.User;
const Notification = db.Notification;
const Admin = db.Admin;
const Client = db.Client;
const Doctor = db.Doctor;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { Op } = require("sequelize");

// exports.getMessageStats = async (req, res) => {
// 	try {
// 		const token = req.headers.authorization.split(" ")[1];
// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		const userId = decoded.user_id;

// 		const total = await Message.count();
// 		const unread = await Message.count({ where: { read: false } });
// 		const delivered = await Message.count({ where: { delivered: true } });

// 		res.status(200).json({
// 			total,
// 			unread,
// 			delivered,
// 		});
// 	} catch (err) {
// 		res.status(500).json({ message: err.message });
// 	}
// };

exports.getMessageStats = async (req, res) => {
	try {
		// ✅ Safely handle missing Authorization header
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return res.status(401).json({ message: "No token provided" });
		}

		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// ⚠️ Make sure your JWT payload uses the correct property name
		// In your login, if you used `jwt.sign({ userId: user.id }, ...)`, then:
		const userId = decoded.userId || decoded.user_id;

		// // ✅ Now perform your counts
		// const total = await Message.count({
		// 	where: { receiver_id: userId },
		// });

		const unread = await Message.count({
			where: { receiver_id: userId, read: false },
		});

		const read = await Message.count({
			where: { receiver_id: userId, read: true },
		});

		res.status(200).json({
			total: unread + read,
			unread,
			read,
		});
	} catch (err) {
		console.error("Error fetching message stats:", err);
		res
			.status(500)
			.json({ message: "Something went wrong", error: err.message });
	}
};

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
// 		console.error("Error getting conversation:", err);
// 		res.status(500).json({ error: err.message });
// 	}
// };

exports.getConversation = async (req, res) => {
	try {
		const { user1, user2 } = req.params;

		// Fetch messages between the two users
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

		// ✅ Mark all messages received by user1 as read
		await Message.update(
			{ read: true },
			{
				where: {
					sender_id: user2, // messages sent by the other user
					receiver_id: user1, // received by current user
					read: false, // only update unread messages
				},
			}
		);

		res.json(msgs);
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

// 		// Get the admin’s user_id (assuming there's only one)
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

// 		// 🧠 Transform the response to include sender_role
// 		const formatted = msgs.map((msg) => ({
// 			message_id: msg.message_id,
// 			type: msg.type,
// 			content: msg.content,
// 			createdAt: msg.createdAt,
// 			read: msg.read,
// 			sender_id: msg.sender_id,
// 			receiver_id: msg.receiver_id,
// 			sender_role: msg.sender?.role, // ✅ added
// 			receiver_role: msg.receiver?.role, // optional
// 		}));

// 		res.json(formatted);
// 	} catch (err) {
// 		console.error("Error getting conversation:", err);
// 		res.status(500).json({ error: err.message });
// 	}
// };

// exports.getConversationAdmin = async (req, res) => {
// 	try {
// 		const token = req.headers.authorization?.split(" ")[1];
// 		if (!token) return res.status(401).json({ message: "No token provided." });

// 		const decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		const adminId = decoded.user_id;

// 		// 🔹 Fetch messages where admin is sender or receiver
// 		const messages = await Message.findAll({
// 			where: { [Op.or]: [{ sender_id: adminId }, { receiver_id: adminId }] },
// 			order: [["createdAt", "DESC"]],
// 			attributes: [
// 				"message_id",
// 				"sender_id",
// 				"receiver_id",
// 				"content",
// 				"createdAt",
// 			],
// 		});

// 		if (messages.length === 0) return res.json([]);

// 		// 🔹 Fetch all users (with both associations, filtered later)
// 		const users = await User.findAll({
// 			where: { user_id: { [Op.in]: userIds } },
// 			attributes: ["user_id", "email", "role", "profile_picture"],
// 		});

// 		const results = await Promise.all(
// 			users.map(async (user) => {
// 				let name = "";
// 				if (user.role === "client") {
// 					const client = await Client.findOne({
// 						where: { user_id: user.user_id },
// 						attributes: ["first_name", "last_name"],
// 					});
// 					if (client) {
// 						name = `${client.first_name} ${client.last_name}`;
// 					}
// 				} else if (user.role === "doctor") {
// 					const doctor = await Doctor.findOne({
// 						where: { user_id: user.user_id },
// 						attributes: ["first_name", "last_name"],
// 					});
// 					if (doctor) {
// 						name = `${doctor.first_name} ${doctor.last_name}`;
// 					}
// 				}
// 				return { user, name };
// 			})
// 		);

// 		// 🔹 Construct conversation list
// 		const convoList = results.map(({ user, name }) => {
// 			const userMessages = messages.filter(
// 				(msg) =>
// 					msg.sender_id === user.user_id || msg.receiver_id === user.user_id
// 			);
// 			const lastMsg = userMessages.length ? userMessages[0] : null;
// 			return {
// 				conversation_user_id: user.user_id,
// 				email: user.email,
// 				role: user.role,
// 				profile_picture: user.profile_picture,
// 				last_message: lastMsg ? lastMsg.content : null,
// 				last_time: lastMsg ? lastMsg.createdAt : null,
// 				name: name,
// 			};
// 		});

// 		res.json(convoList);
// 	} catch (err) {
// 		console.error("Error fetching user conversations:", err);
// 		res.status(500).json({ error: err.message });
// 	}
// };

exports.getConversationAdmin = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided." });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const adminId = decoded.user_id;

		// 🔹 Fetch messages where admin is sender or receiver
		const messages = await Message.findAll({
			where: { [Op.or]: [{ sender_id: adminId }, { receiver_id: adminId }] },
			order: [["createdAt", "DESC"]],
			attributes: [
				"message_id",
				"sender_id",
				"receiver_id",
				"content",
				"createdAt",
			],
		});

		if (messages.length === 0) return res.json([]);

		// 🔹 Extract all unique user IDs (excluding the admin)
		const userIds = [
			...new Set(
				messages
					.map((m) => (m.sender_id === adminId ? m.receiver_id : m.sender_id))
					.filter((id) => id !== null)
			),
		];

		// 🔹 Fetch all users from those IDs
		const users = await User.findAll({
			where: { user_id: { [Op.in]: userIds } },
			attributes: ["user_id", "email", "role", "profile_picture"],
		});

		// 🔹 Get user names from client/doctor tables
		const results = await Promise.all(
			users.map(async (user) => {
				let name = "";

				if (user.role === "client") {
					const client = await Client.findOne({
						where: { user_id: user.user_id },
						attributes: ["first_name", "last_name"],
					});
					if (client) name = `${client.first_name} ${client.last_name}`;
				} else if (user.role === "doctor") {
					const doctor = await Doctor.findOne({
						where: { user_id: user.user_id },
						attributes: ["first_name", "last_name"],
					});
					if (doctor) name = `${doctor.first_name} ${doctor.last_name}`;
				}

				return { user, name };
			})
		);

		// 🔹 Build the conversation list
		const convoList = results.map(({ user, name }) => {
			const userMessages = messages.filter(
				(msg) =>
					msg.sender_id === user.user_id || msg.receiver_id === user.user_id
			);
			const lastMsg = userMessages.length ? userMessages[0] : null;

			return {
				conversation_user_id: user.user_id,
				email: user.email,
				role: user.role,
				profile_picture: user.profile_picture,
				last_message: lastMsg ? lastMsg.content : null,
				last_time: lastMsg ? lastMsg.createdAt : null,
				name,
			};
		});

		res.json(convoList);
	} catch (err) {
		console.error("Error fetching user conversations:", err);
		res.status(500).json({ error: err.message });
	}
};

exports.getUsersWithConversations = async (req, res) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) return res.status(401).json({ message: "No token provided." });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const adminId = decoded.user_id;
		console.log("Admin ID:", adminId);

		const messages = await Message.findAll({
			where: { [Op.or]: [{ sender_id: adminId }, { receiver_id: adminId }] },
			order: [["createdAt", "DESC"]],
			attributes: [
				"message_id",
				"sender_id",
				"receiver_id",
				"content",
				"createdAt",
			],
		});

		console.log("Messages found:", messages.length);

		if (messages.length === 0) {
			return res.json([]);
		}

		const userIds = [
			...new Set(
				messages.map((msg) =>
					msg.sender_id === adminId ? msg.receiver_id : msg.sender_id
				)
			),
		];
		console.log("User IDs with conversations:", userIds);

		if (userIds.length === 0) return res.json([]);

		const users = await User.findAll({
			where: { user_id: { [Op.in]: userIds } },
			attributes: ["user_id", "email", "role", "profile_picture"],
		});

		console.log("Fetched users:", users.length);

		const convoList = users.map((user) => {
			console.log("Processing user:", user);
			const userMessages = messages.filter(
				(msg) =>
					msg.sender_id === user.user_id || msg.receiver_id === user.user_id
			);
			const lastMsg = userMessages.length ? userMessages[0] : null;

			return {
				conversation_user_id: user.user_id,
				email: user.email,
				role: user.role,
				profile_picture: user.profile_picture,
				last_message: lastMsg ? lastMsg.content : null,
				last_time: lastMsg ? lastMsg.createdAt : null,
				name:
					user.role === "client"
						? `${user.client?.first_name || ""} ${user.client?.last_name || ""}`
						: `${user.doctor?.first_name || ""} ${
								user.doctor?.last_name || ""
						  }`,
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
