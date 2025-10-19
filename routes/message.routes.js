// routes/message.routes.js
const router = require("express").Router();
const controller = require("../controllers/message.controllers");

router.post("/client", controller.sendMessageClient);
router.post("/doctor", controller.sendMessageDoctor);
router.get("/:user1/:user2", controller.getConversation);
router.put("/read/:messageId", controller.markAsRead);

module.exports = router;
