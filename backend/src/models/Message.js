const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },

    receiverId: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    // MESSAGE STATUS
    // "sent" = saved to DB
    // "delivered" = receiver is online / received via socket
    // "seen" = receiver opened the chat
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    // kept for backward compat
    seen: {
      type: Boolean,
      default: false,
    },

    // UNSEND  (soft-delete — keeps the bubble as "This message was unsent")
    unsent: {
      type: Boolean,
      default: false,
    },

    // REPLY
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // FORWARD
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    isForwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
