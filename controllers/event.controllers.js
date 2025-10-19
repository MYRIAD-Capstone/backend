const db = require("../models");
const Event = db.Event;
const EventInterest = db.EventInterest;
const Notification = db.Notification; // ✅ Import notification model
const User = db.User; // ✅ to notify all users
const { Op, Sequelize } = require("sequelize");

// exports.createEvent = async (req, res) => {
// 	try {
// 		const { title, date, time, description, location, status } = req.body;

// 		console.log(title, date, time, description, location, status);
// 		const image = req.file ? req.file.path : null;
// 		console.log("Uploaded image filename:", req.file);
// 		if (!title || !date || !time) {
// 			return res
// 				.status(400)
// 				.json({ message: "Title, date, and time are required." });
// 		}

// 		const newEvent = await Event.create({
// 			title,
// 			date,
// 			time,
// 			description,
// 			location,
// 			status: status || "upcoming",
// 			image,
// 		});

// 		res
// 			.status(201)
// 			.json({ message: "Event created successfully!", event: newEvent });
// 	} catch (error) {
// 		console.error("Error creating event:", error);
// 		res.status(500).json({ message: "Internal server error." });
// 	}
// };

// controllers/event.controller.js

exports.createEvent = async (req, res) => {
	try {
		const { title, date, time, description, location, status } = req.body;
		const image = req.file ? req.file.path : null;

		if (!title || !date || !time) {
			return res
				.status(400)
				.json({ message: "Title, date, and time are required." });
		}

		// ✅ 1. Create the event
		const newEvent = await Event.create({
			title,
			date,
			time,
			description,
			location,
			status: status || "upcoming",
			image,
		});

		// ✅ 2. Notify all users (new_event type)
		const users = await User.findAll({ attributes: ["user_id"] });
		if (users && users.length > 0) {
			const notifications = users.map((u) => ({
				user_id: u.user_id,
				type: "new_event",
				title: "New Event Posted 🎉",
				message: `A new event titled "${title}" has been posted!`,
				related_id: newEvent.event_id,
			}));

			await Notification.bulkCreate(notifications);
		}

		res.status(201).json({
			message: "Event created successfully and notifications sent!",
			event: newEvent,
		});
	} catch (error) {
		console.error("Error creating event:", error);
		res.status(500).json({ message: "Internal server error." });
	}
};

exports.getAllEvents = async (req, res) => {
	try {
		const { keyword, date, status } = req.query;

		// Build filter conditions
		const where = {};

		if (keyword) {
			const search = { [Op.iLike]: `%${keyword}%` };
			where[Op.or] = [
				{ title: search },
				{ description: search },
				{ location: search },
			];
		}

		if (date) {
			where.date = date; // should be in YYYY-MM-DD
		}

		if (status && status.toLowerCase() !== "all") {
			where.status = status.toLowerCase();
		}

		const events = await Event.findAll({
			where,
			order: [["date", "ASC"]],
			include: [
				{
					model: EventInterest,
					as: "interests",
					attributes: [],
				},
			],
		});

		const formatted = await Promise.all(
			events.map(async (event) => {
				const interestCount = await EventInterest.count({
					where: { event_id: event.event_id, status: "enabled" },
				});

				return {
					title: event.title,
					date: new Date(event.date).toLocaleDateString("en-US", {
						month: "long",
						day: "numeric",
						year: "numeric",
					}),
					time: event.time,
					description: event.description,
					location: event.location,
					interested: interestCount,
					status: capitalize(event.status),
					image: event.image,
				};
			})
		);

		res.status(200).json(formatted);
	} catch (error) {
		console.error("Error fetching events:", error);
		res.status(500).json({ message: "Internal server error." });
	}
};

exports.getMonthlyEvents = async (req, res) => {
	try {
		const { year } = req.params; // ✅ use query param for consistency (?year=2025)

		if (!year) {
			return res
				.status(400)
				.json({ message: "Year is required (e.g., ?year=2025)" });
		}

		// 🔹 Query: Count events per month for the given year
		const results = await Event.findAll({
			attributes: [
				[Sequelize.fn("MONTH", Sequelize.col("date")), "month"],
				[Sequelize.fn("COUNT", Sequelize.col("event_id")), "count"],
			],
			where: Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("date")), year),
			group: [Sequelize.fn("MONTH", Sequelize.col("date"))],
			order: [[Sequelize.fn("MONTH", Sequelize.col("date")), "ASC"]],
		});

		// 🔹 Fill months without events with 0
		const monthlyData = Array.from({ length: 12 }, (_, i) => {
			const monthResult = results.find((r) => r.dataValues.month === i + 1);
			return {
				month: new Date(year, i).toLocaleString("default", { month: "short" }),
				count: monthResult ? parseInt(monthResult.dataValues.count, 10) : 0,
			};
		});

		// ✅ Return formatted response
		res.status(200).json({
			year,
			data: monthlyData,
		});
	} catch (error) {
		console.error("Error fetching monthly events:", error);
		res.status(500).json({ message: "Server error occurred" });
	}
};

// 🗓️ Get Upcoming Events for the Current Month
exports.getUpcomingEventsThisMonth = async (req, res) => {
	try {
		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth() + 1; // JS months are 0-indexed

		// Get first and last day of current month
		const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
		const endOfMonth = new Date(currentYear, currentMonth, 0); // last day of month

		// 🔹 Query: Get events scheduled for this month & still "upcoming"
		const events = await Event.findAll({
			where: {
				date: {
					[Op.between]: [startOfMonth, endOfMonth],
				},
				status: "upcoming",
			},
			order: [["date", "ASC"]],
		});

		// Format the events for the frontend
		const formatted = events.map((event) => ({
			event_id: event.event_id,
			title: event.title,
			date: new Date(event.date).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			}),
			time: event.time,
			description: event.description,
			location: event.location,
			status: event.status,
			image: event.image,
		}));

		res.status(200).json({
			currentMonth: new Date(currentYear, currentMonth - 1).toLocaleString(
				"default",
				{ month: "long" }
			),
			year: currentYear,
			count: formatted.length,
			events: formatted,
		});
	} catch (error) {
		console.error("Error fetching upcoming events this month:", error);
		res.status(500).json({ message: "Server error occurred" });
	}
};

// Helper to capitalize first letter
function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
