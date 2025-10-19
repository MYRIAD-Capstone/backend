module.exports = (sequelize, Sequelize) => {
	const Field = sequelize.define(
		"field",
		{
			field_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			type: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			required: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			timestamps: true, // Adds createdAt and updatedAt fields
			tableName: "fields", // Explicitly set the table name
		}
	);
	return Field;
};
