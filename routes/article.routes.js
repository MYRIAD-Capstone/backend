const express = require("express");
const router = express.Router();
const articleController = require("../controllers/article.controllers.js");

// Order matters
router.post("/", articleController.createArticle);
router.get("/by-like", articleController.getAllArticlesWithCountsByUser); // Specific route first
router.get("/", articleController.getAllArticlesWithCounts);
router.get("/:id", articleController.getArticleById); // Dynamic route last
router.post("/like", articleController.toggleLike);
router.post("/comment", articleController.createComment);
router.delete("/comment/:comment_id", articleController.deleteComment);

module.exports = router;
