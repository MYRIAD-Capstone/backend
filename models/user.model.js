module.exports = (sequelize, Sequelize) => {
	const User = sequelize.define(
		"user",
		{
			user_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			password: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: "pending", // Default status
				validate: {
					isIn: [["enabled", "disabled", "pending"]],
				},
			},
			role: {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: "client", // Default role
				validate: {
					isIn: [["admin", "doctor", "client"]],
				},
			},
			profile_picture: {
				type: Sequelize.STRING,
				allowNull: true,
			},
		},
		{
			timestamps: true, // Adds createdAt and updatedAt fields
			tableName: "users", // Explicitly set the table name
		}
	);
	return User;
};
