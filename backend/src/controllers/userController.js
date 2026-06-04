const User = require("../models/User");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const Post = require("../models/Post");

const setRequestNotifications = async (receiver, sender, status) => {
  await Notification.updateMany(
    {
      receiver,
      sender,
      type: "connection_request",
    },
    {
      read: true,
      actionStatus: status,
    }
  );
};

// REGISTER USER
const registerUser = async (req, res) => {

  try {

    const {
      fullName,
      phone,
      email,
      dob,
      role,
      password,
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {

      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      phone,
      email,
      dob,
      role,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      message: "User Registered Successfully",
      token,
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: "Registration Failed",
    });
  }
};


// LOGIN USER
const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {

      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {

      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login Successful",
      token,
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: "Login Failed",
    });
  }
};


// GET USERS
const getUsers = async (req, res) => {

  try {

    const users = await User.find().select("-password");

    res.json(users);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};
const sendRequest = async (req, res) => {

  try {

    const senderId = req.user.id;

    const receiverId = req.params.id;

    const receiver = await User.findById(receiverId);

    if (!receiver) {

      return res.status(404).json({
        message: "User not found",
      });
    }

    if (senderId === receiverId) {

      return res.status(400).json({
        message: "You cannot connect with yourself",
      });
    }

    const sender = await User.findById(senderId);

    if (
      receiver.connections.some(
        (id) => id.toString() === senderId
      )
    ) {

      return res.status(400).json({
        message: "Already connected",
      });
    }

    if (!receiver.isPrivate) {
      if (!receiver.connections.some((id) => id.toString() === senderId)) {
        receiver.connections.push(senderId);
      }

      if (
        sender &&
        !sender.connections.some((id) => id.toString() === receiverId)
      ) {
        sender.connections.push(receiverId);
      }

      await receiver.save();
      if (sender) await sender.save();

      await setRequestNotifications(receiverId, senderId, "accepted");
      await setRequestNotifications(senderId, receiverId, "accepted");

      await Notification.create({
        receiver: receiverId,
        sender: senderId,
        type: "request_accepted",
        text: "connected with you",
        actionStatus: "accepted",
      });

      return res.json({
        message: "Connected",
        status: "connected",
      });
    }

    // Prevent duplicate requests
    if (
      receiver.requests.some(
        (id) => id.toString() === senderId
      )
    ) {

      return res.status(400).json({
        message: "Request already sent",
      });
    }

receiver.requests.push(senderId);

await receiver.save();

await setRequestNotifications(receiverId, senderId, "none");

await Notification.create({
  receiver: receiverId,
  sender: senderId,
  type: "connection_request",
  text: "sent you a connection request",
  actionStatus: "pending",
});

res.json({
  message: "Connection request sent",
  status: "requested",
});

  } catch (error) {

    res.status(500).json({
      message: "Failed to send request",
    });
  }
};
const getRequests = async (req, res) => {

  try {

    const user = await User.findById(req.user.id)
      .populate("requests", "fullName email role");

    res.json(user.requests);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch requests",
    });
  }
};
const acceptRequest = async (req, res) => {

  try {

    const currentUser = await User.findById(req.user.id);

    const sender = await User.findById(req.params.id);

    if (!sender) {

      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      !currentUser.requests.some(
        (id) => id.toString() === sender._id.toString()
      )
    ) {

      return res.status(400).json({
        message: "No pending request from this user",
      });
    }

    // Add connections both sides
    if (
      !currentUser.connections.some(
        (id) => id.toString() === sender._id.toString()
      )
    ) {
      currentUser.connections.push(sender._id);
    }

    if (
      !sender.connections.some(
        (id) => id.toString() === currentUser._id.toString()
      )
    ) {
      sender.connections.push(currentUser._id);
    }

    // Remove request
    currentUser.requests =
      currentUser.requests.filter(
        (id) => id.toString() !== sender._id.toString()
      );

 await currentUser.save();

await sender.save();

await Notification.create({
  receiver: sender._id,
  sender: currentUser._id,
  type: "request_accepted",
  text: "accepted your connection request",
  actionStatus: "accepted",
});

await Notification.updateMany(
  {
    receiver: req.user.id,
    sender: req.params.id,
    type: "connection_request",
  },
  {
    read: true,
    actionStatus: "accepted",
  }
);

res.json({
  message: "Connection accepted",
  user: sender,
});

  } catch (error) {

    res.status(500).json({
      message: "Failed to accept request",
    });
  }
};

const disconnectUser = async (req, res) => {

  try {

    const currentUser = await User.findById(req.user.id);

    const otherUser = await User.findById(req.params.id);

    if (!otherUser) {

      return res.status(404).json({
        message: "User not found",
      });
    }

    currentUser.connections =
      currentUser.connections.filter(
        (id) => id.toString() !== otherUser._id.toString()
      );

    otherUser.connections =
      otherUser.connections.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );

    await currentUser.save();
    await otherUser.save();

    await setRequestNotifications(req.user.id, req.params.id, "none");
    await setRequestNotifications(req.params.id, req.user.id, "none");

    res.json({
      message: "Connection removed",
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to remove connection",
    });
  }
};

const ignoreRequest = async (req, res) => {

  try {

    const currentUser = await User.findById(req.user.id);

    currentUser.requests =
      currentUser.requests.filter(
        (id) => id.toString() !== req.params.id
      );

    await currentUser.save();

    await setRequestNotifications(req.user.id, req.params.id, "ignored");

    res.json({
      message: "Connection request ignored",
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to ignore request",
    });
  }
};
const getConnections = async (req, res) => {

  try {

    const user = await User.findById(req.user.id)
      .populate(
        "connections",
        "fullName email role profilePicture profileImage headline isOnline lastSeen preferences mentorshipAvailable"
      );
    const hiddenChats = user.hiddenChats || [];

    const connections = (await Promise.all(
      user.connections.map(async (connection) => {
        const connectionId = connection._id.toString();
        const hidden = hiddenChats.find((chat) => chat.userId === connectionId);

        const lastMessage = await Message.findOne({
          $or: [
            { senderId: req.user.id, receiverId: connectionId },
            { senderId: connectionId, receiverId: req.user.id },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        if (
          hidden &&
          (!lastMessage || new Date(lastMessage.createdAt) <= new Date(hidden.hiddenAt))
        ) {
          return null;
        }

        const unreadCount = await Message.countDocuments({
          senderId: connectionId,
          receiverId: req.user.id,
          status: { $ne: "seen" },
          ...(hidden ? { createdAt: { $gt: hidden.hiddenAt } } : {}),
        });

        return {
          ...connection.toObject(),
          lastMessage: lastMessage?.unsent
            ? "This message was unsent"
            : lastMessage?.text || "",
          unreadCount,
          updatedAt: lastMessage?.createdAt || connection.updatedAt,
        };
      })
    )).filter(Boolean);

    connections.sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );

    res.json(connections);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch connections",
    });
  }
};

const updateSettings = async (req, res) => {

  try {

    const {
      isPrivate,
      preferences,
    } = req.body;

    const update = {};

    if (typeof isPrivate === "boolean") {
      update.isPrivate = isPrivate;
    }

    if (preferences && typeof preferences === "object") {
      Object.entries(preferences).forEach(([key, value]) => {
        if (typeof value === "boolean") {
          update[`preferences.${key}`] = value;
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: update,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    res.json(user);

  } catch (error) {

    res.status(500).json({
      message: "Failed to update settings",
    });
  }
};

const exportMyData = async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select("-password").lean();

    const posts = await Post.find({
      user: req.user.id,
    }).lean();

    const messages = await Message.find({
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id },
      ],
    }).lean();

    const notifications = await Notification.find({
      receiver: req.user.id,
    }).lean();

    res.json({
      exportedAt: new Date().toISOString(),
      user,
      posts,
      messages,
      notifications,
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to export data",
    });
  }
};

const deleteMe = async (req, res) => {

  try {

    await Post.deleteMany({
      user: req.user.id,
    });

    await Message.deleteMany({
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id },
      ],
    });

    await Notification.deleteMany({
      $or: [
        { receiver: req.user.id },
        { sender: req.user.id },
      ],
    });

    await User.updateMany(
      {},
      {
        $pull: {
          followers: req.user.id,
          following: req.user.id,
          connections: req.user.id,
          requests: req.user.id,
        },
      }
    );

    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to delete account",
    });
  }
};

const getPlatformStats = async (req, res) => {

  try {

    const totalUsers = await User.countDocuments();

    const totalMentors = await User.countDocuments({
      mentorshipAvailable: true,
    });

    const totalPosts = await Post.countDocuments();

    res.json({
      totalUsers,
      totalMentors,
      totalPosts,
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch stats",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  sendRequest,
  getRequests,
  acceptRequest,
  disconnectUser,
  ignoreRequest,
  getConnections,
  updateSettings,
  exportMyData,
  deleteMe,
  getPlatformStats,
};
