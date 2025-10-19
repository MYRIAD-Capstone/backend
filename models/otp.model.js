module.exports = (sequelize, Sequelize) => {
	const OTP = sequelize.define("otp", {
		otp_id: {
			type: Sequelize.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		user_id: {
			type: Sequelize.INTEGER,
			allowNull: false,
			references: {
				model: "users",
				key: "user_id",
			},
			onDelete: "CASCADE",
		},
		code: {
			type: Sequelize.STRING(6),
			allowNull: false,
		},
		status: {
			type: Sequelize.ENUM("unused", "used"),
			allowNull: false,
			defaultValue: "unused",
		},
	});

	return OTP;
};
