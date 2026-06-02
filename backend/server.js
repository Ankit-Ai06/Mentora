
const postRoutes = require("./src/routes/postRoutes");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./src/routes/userRoutes");
const Message = require("./src/models/Message");
const messageRoutes = require("./src/routes/messageRoutes");
const authRoutes = require("./src/routes/authRoutes");
const User = require("./src/models/User");
const notificationRoutes = require("./src/routes/notificationRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");


const connectDB = require("./src/config/db");
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
  },
});

// ─── ONLINE USERS MAP  userId → socketId ─────────────────────────
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ── JOIN ──────────────────────────────────────────────────────
  socket.on("join", async (userId) => {
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });

    // deliver any "sent" messages that arrived while user was offline
    await Message.updateMany(
      { receiverId: userId, status: "sent" },
      { status: "delivered" }
    );

    // notify senders their messages are delivered
    const deliveredMsgs = await Message.find({
      receiverId: userId,
      status: "delivered",
    });

    const senderIds = [...new Set(deliveredMsgs.map((m) => m.senderId.toString()))];
    senderIds.forEach((sid) => {
      const sSocket = onlineUsers.get(sid);
      if (sSocket) {
        io.to(sSocket).emit("messagesDelivered", { toReceiverId: userId });
      }
    });

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // ── SEND MESSAGE ──────────────────────────────────────────────
  socket.on("sendMessage", async (message) => {
    const receiverSocketId = onlineUsers.get(message.receiverId);

    if (receiverSocketId) {
      // receiver is online → mark delivered immediately
      await Message.findByIdAndUpdate(message._id, { status: "delivered" });
      message.status = "delivered";

      io.to(receiverSocketId).emit("receiveMessage", message);

      // tell sender it's delivered
      socket.emit("messageStatusUpdate", {
        messageId: message._id,
        status: "delivered",
      });
    }
    // if offline, stays "sent" – will be delivered on their next join
  });

  // ── MESSAGE SEEN ──────────────────────────────────────────────
  // frontend emits this when chat is opened / scrolled to bottom
  socket.on("messageSeen", async ({ senderId, receiverId }) => {
    const updated = await Message.updateMany(
      { senderId, receiverId, status: { $ne: "seen" } },
      { status: "seen", seen: true }
    );

    if (updated.modifiedCount > 0) {
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdate", {
          senderId,
          receiverId,
          status: "seen",
        });
      }
    }
  });

  // ── UNSEND MESSAGE ────────────────────────────────────────────
  socket.on("unsendMessage", async ({ messageId, senderId, receiverId }) => {
    await Message.findByIdAndUpdate(messageId, { unsent: true, text: "" });

    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageUnsent", { messageId });
    }

    socket.emit("messageUnsent", { messageId });
  });

  // ── TYPING INDICATOR ─────────────────────────────────────────
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId });
    }
  });

  // ── DISCONNECT ────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        break;
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log("User disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} already in use. Run: netstat -ano | findstr :${PORT}`);
    process.exit(1);
  }
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/profile", profileRoutes);

app.get("/", (req, res) => {
  res.send("Mentora Backend Running");
});


