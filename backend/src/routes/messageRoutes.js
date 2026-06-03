const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
  unsendMessage,
  forwardMessage,
  markDelivered,
  markSeen,
  getUnreadCount,
} = require("../controllers/messageController");

// send
router.post("/", sendMessage);

// unread count
router.get("/unread/:userId", getUnreadCount);

// get conversation
router.get("/:senderId/:receiverId", getMessages);

// unsend
router.put("/unsend/:messageId", unsendMessage);

// forward
router.post("/forward", forwardMessage);

// mark delivered (called when receiver comes online)
router.put("/delivered", markDelivered);

// mark seen (called when receiver opens the chat)
router.put("/seen", markSeen);

module.exports = router;
