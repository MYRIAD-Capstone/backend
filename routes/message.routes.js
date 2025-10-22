// routes/message.routes.js
const router = require("express").Router();
const controller = require("../controllers/message.controllers");

router.post("/client", controller.sendMessageClient);
router.post("/doctor", controller.sendMessageDoctor);
router.post("/admin", controller.sendMessageToAdmin);
router.get("/:user1/:user2", controller.getConversation);
router.get("/admin-convo", controller.getConversationAdmin);
router.put("/read/:messageId", controller.markAsRead);
router.get("/admin", controller.getUsersWithConversations);
router.get("/stats", controller.getMessageStats);
module.exports = router;
