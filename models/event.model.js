const { image } = require("../config/cloudinary");

module.exports = (sequelize, Sequelize) => {
	const Event = sequelize.define(
		"event",
		{
			event_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			title: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			date: {
				type: Sequelize.DATEONLY,
				allowNull: false,
			},
			time: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			image: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			location: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: "upcoming",
				validate: {
					isIn: [["upcoming", "completed", "cancelled", "draft"]],
				},
			},
		},
		{
			timestamps: true,
			tableName: "events",
		}
	);

	return Event;
};
