module.exports = (sequelize, Sequelize) => {
	const Like = sequelize.define(
		"like",
		{
			like_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			article_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
		},
		{
			timestamps: true,
			tableName: "likes",
			indexes: [
				{
					unique: true,
					fields: ["article_id", "user_id"], // Prevents duplicate likes
				},
			],
		}
	);
	return Like;
};
