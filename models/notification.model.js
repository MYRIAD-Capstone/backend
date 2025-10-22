// models/notification.model.js
module.exports = (sequelize, Sequelize) => {
	const Notification = sequelize.define(
		"Notification",
		{
			notification_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "users", // name of the table being referenced
					key: "user_id",
				},
				onDelete: "CASCADE", // if user is deleted, notifications are deleted too
			},
			type: {
				type: Sequelize.ENUM(
					"new_article",
					"new_event",
					"upcoming_event",
					"comment",
					"like",
					"message"
				),
				allowNull: false,
				comment: "Type of notification event",
			},
			title: {
				type: Sequelize.STRING(255),
				allowNull: false,
				comment: "Short title or summary of the notification",
			},
			message: {
				type: Sequelize.TEXT,
				allowNull: false,
				comment: "Detailed message or body of the notification",
			},
			related_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
				comment:
					"References article_id, event_id, or message_id depending on type",
			},
			is_read: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				comment: "True if the user has read the notification",
			},
		},
		{
			tableName: "notifications",
			timestamps: true, // createdAt, updatedAt
			underscored: true, // makes columns like created_at instead of createdAt
			indexes: [{ fields: ["user_id"] }, { fields: ["type"] }],
		}
	);

	return Notification;
};
