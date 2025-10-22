// models/message.model.js
module.exports = (sequelize, Sequelize) => {
	const Message = sequelize.define(
		"message",
		{
			message_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			sender_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "users",
					key: "user_id",
				},
			},
			receiver_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "users",
					key: "user_id",
				},
			},
			type: {
				type: Sequelize.ENUM("text", "image"),
				allowNull: false,
				defaultValue: "text",
			},
			content: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			delivered: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			read: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			timestamps: true,
			tableName: "messages",
		}
	);
	return Message;
};
