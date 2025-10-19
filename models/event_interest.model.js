module.exports = (sequelize, Sequelize) => {
	const EventInterest = sequelize.define(
		"event_interest",
		{
			event_interest_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			event_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "events",
					key: "event_id",
				},
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "users",
					key: "user_id",
				},
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: "pending",
				validate: {
					isIn: [["enabled", "pending", "disabled"]],
				},
			},
		},
		{
			timestamps: true,
			tableName: "event_interests",
		}
	);

	return EventInterest;
};
