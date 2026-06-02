const User = require("../models/User");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");


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

    // Prevent duplicate requests
    if (
      receiver.requests.includes(senderId)
    ) {

      return res.status(400).json({
        message: "Request already sent",
      });
    }

receiver.requests.push(senderId);

await receiver.save();

await Notification.create({
  receiver: receiverId,
  sender: senderId,
  type: "connection_request",
  text: "sent you a connection request",
});

res.json({
  message: "Connection request sent",
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

    // Add connections both sides
    currentUser.connections.push(sender._id);

    sender.connections.push(currentUser._id);

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
});

res.json({
  message: "Connection accepted",
});

  } catch (error) {

    res.status(500).json({
      message: "Failed to accept request",
    });
  }
};
const getConnections = async (req, res) => {

  try {

    const user = await User.findById(req.user.id)
      .populate(
        "connections",
        "fullName email role"
      );

    res.json(user.connections);

  } catch (error) {

    res.status(500).json({
      message: "Failed to fetch connections",
    });
  }
};
const Post = require("../models/Post");

const getPlatformStats = async (req, res) => {

  try {

    const totalUsers = await User.countDocuments();

    const totalMentors = await User.countDocuments({
      role: "Mentor",
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
  getConnections,
  getPlatformStats,
};