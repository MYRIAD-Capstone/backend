module.exports = (sequelize, Sequelize) => {
	const Doctor = sequelize.define(
		"doctor",
		{
			doctor_id: {
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
			field_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "fields",
					key: "field_id",
				},
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
			valid_id: {
				type: Sequelize.STRING,
				allowNull: true,
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
			tableName: "doctors",
		}
	);
	return Doctor;
};
