module.exports = (sequelize, Sequelize) => {
	const Appointment = sequelize.define(
		"appointment",
		{
			appointment_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			doctor_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "doctors",
					key: "doctor_id",
				},
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "users",
					key: "user_id",
				},
				onUpdate: "CASCADE",
				onDelete: "CASCADE",
			},
			date: {
				type: Sequelize.DATEONLY, // Only the date part
				allowNull: false,
			},
			time: {
				type: Sequelize.TIME, // Only the time part
				allowNull: false,
			},
			remarks: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: "Pending",
				validate: {
					isIn: [["Pending", "Approved", "Cancelled"]],
				},
			},
		},
		{
			timestamps: true,
			tableName: "appointments",
		}
	);

	return Appointment;
};
