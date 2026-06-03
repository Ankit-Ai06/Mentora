const Message = require("../models/Message");
const Notification = require("../models/Notification");

// ─── SEND MESSAGE ────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text, replyTo } = req.body;

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      replyTo: replyTo || null,
      status: "sent",
    });

    // populate replyTo so the frontend gets the quoted text immediately
    await newMessage.populate("replyTo", "text senderId unsent");

    await Notification.create({
      receiver: receiverId,
      sender: senderId,
      type: "message",
      text: "sent you a message",
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Message send failed" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.params.userId,
      status: { $ne: "seen" },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unread messages" });
  }
};

// ─── GET MESSAGES ────────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("replyTo", "text senderId unsent");

    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// ─── UNSEND MESSAGE ──────────────────────────────────────────────
const unsendMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    message.unsent = true;
    message.text = "";
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to unsend message" });
  }
};

// ─── FORWARD MESSAGE ─────────────────────────────────────────────
const forwardMessage = async (req, res) => {
  try {
    const { originalMessageId, senderId, receiverIds } = req.body;

    const original = await Message.findById(originalMessageId);
    if (!original || original.unsent) {
      return res.status(404).json({ message: "Original message not found" });
    }

    const forwarded = await Promise.all(
      receiverIds.map((receiverId) =>
        Message.create({
          senderId,
          receiverId,
          text: original.text,
          isForwarded: true,
          forwardedFrom: original._id,
          status: "sent",
        })
      )
    );

    res.status(201).json(forwarded);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to forward message" });
  }
};

// ─── MARK MESSAGES AS DELIVERED ──────────────────────────────────
const markDelivered = async (req, res) => {
  try {
    const { receiverId, senderId } = req.body;

    await Message.updateMany(
      { senderId, receiverId, status: "sent" },
      { status: "delivered" }
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to mark delivered" });
  }
};

// ─── MARK MESSAGES AS SEEN ───────────────────────────────────────
const markSeen = async (req, res) => {
  try {
    const { receiverId, senderId } = req.body;

    await Message.updateMany(
      { senderId, receiverId, status: { $ne: "seen" } },
      { status: "seen", seen: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to mark seen" });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  unsendMessage,
  forwardMessage,
  markDelivered,
  markSeen,
  getUnreadCount,
};
