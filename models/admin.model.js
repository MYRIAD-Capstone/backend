module.exports = (sequelize, Sequelize) => {
	const Admin = sequelize.define(
		"admin",
		{
			admin_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			first_name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			middle_name: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			last_name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			contact_number: {
				type: Sequelize.STRING,
				allowNull: false,
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
				defaultValue: "enabled",
				validate: {
					isIn: [["enabled", "disabled", "pending"]],
				},
			},
		},
		{
			timestamps: true,
			tableName: "admins",
		}
	);
	return Admin;
};
