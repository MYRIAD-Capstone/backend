module.exports = (sequelize, Sequelize) => {
	const Comment = sequelize.define(
		"comment",
		{
			comment_id: {
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
				references: {
					model: "users",
					key: "user_id",
				},
			},
			content: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
		},
		{
			timestamps: true,
			tableName: "comments",
		}
	);
	return Comment;
};
