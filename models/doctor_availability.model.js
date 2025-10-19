module.exports = (sequelize, Sequelize) => {
	const DoctorAvailability = sequelize.define(
		"doctor_availability",
		{
			availability_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			doctor_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "doctors", // name of the doctors table
					key: "doctor_id",
				},
			},
			date: {
				type: Sequelize.DATEONLY, // yyyy-mm-dd
				allowNull: false,
			},
			start_time: {
				type: Sequelize.TIME, // hh:mm:ss
				allowNull: false,
			},
			end_time: {
				type: Sequelize.TIME,
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM("available", "unavailable"),
				defaultValue: "available",
			},
		},
		{
			timestamps: true,
			tableName: "doctor_availability",
		}
	);
	return DoctorAvailability;
};
