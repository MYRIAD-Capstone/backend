module.exports = (sequelize, Sequelize) => {
	const Article = sequelize.define(
		"article",
		{
			article_id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			title: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			slug: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			content: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			excerpt: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: "draft",
				validate: {
					isIn: [["draft", "published", "archived"]],
				},
			},
			user_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "users", // table name
					key: "user_id", // primary key in the users table
				},
			},
			likes_count: {
				type: Sequelize.INTEGER,
				allowNull: false,
				defaultValue: 0,
			},
			link: {
				type: Sequelize.STRING,
				allowNull: true,
			},
		},
		{
			timestamps: true,
			tableName: "articles",
		}
	);
	return Article;
};
