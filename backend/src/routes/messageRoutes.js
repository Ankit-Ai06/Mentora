const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
  unsendMessage,
  forwardMessage,
  markDelivered,
  markSeen,
} = require("../controllers/messageController");

// send
router.post("/", sendMessage);

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
