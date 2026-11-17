
const express = require("express");
const controller = require("../controllers/messageController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.post("/conversations", controller.createConversation);
router.get("/conversations", controller.getConversations);

router.get(
  "/conversations/:conversationId/messages",
  controller.getMessages
);

router.post(
  "/conversations/:conversationId/messages",
  controller.sendMessage
);

router.patch("/messages/:messageId", controller.editMessage);
router.delete("/messages/:messageId", controller.deleteMessage);

module.exports = router;
