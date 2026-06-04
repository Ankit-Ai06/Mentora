const express = require("express");
const router = express.Router();

const Notification =
require("../models/Notification");
const User =
require("../models/User");

const protect =
require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  async (req, res) => {
    try {

      const currentUser =
      await User.findById(req.user.id).select("requests");

      const notifications =
      await Notification.find({
        receiver: req.user.id
      })
      .populate(
        "sender",
        "fullName email profilePicture profileImage"
      )
      .sort({
        createdAt: -1
      });

      res.json(
        notifications.map((notification) => {
          const item = notification.toObject();
          const senderId = item.sender?._id?.toString();
          const requestPending =
            item.type === "connection_request" &&
            senderId &&
            currentUser?.requests?.some((id) => id.toString() === senderId);

          return {
            ...item,
            requestPending: !!requestPending,
            actionStatus: requestPending
              ? "pending"
              : item.actionStatus || "none",
          };
        })
      );

    } catch (err) {

      res.status(500).json({
        message:
        "Failed to fetch notifications"
      });

    }
  }
);

router.get(
  "/unread-count",
  protect,
  async (req, res) => {
    try {
      const count =
      await Notification.countDocuments({
        receiver: req.user.id,
        read: false
      });

      res.json({ count });
    } catch (err) {
      res.status(500).json({
        message:
        "Failed to fetch unread notifications"
      });
    }
  }
);

router.put(
  "/read-all",
  protect,
  async (req, res) => {
    try {
      await Notification.updateMany(
        {
          receiver: req.user.id,
          read: false
        },
        {
          read: true
        }
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({
        message:
        "Failed to update notifications"
      });
    }
  }
);

router.put(
  "/read/:id",
  protect,
  async (req, res) => {

    try {

      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          receiver: req.user.id,
        },
        {
          read: true
        }
      );

      res.json({
        success: true
      });

    } catch (err) {

      res.status(500).json({
        message:
        "Failed to update notification"
      });

    }

  }
);

module.exports = router;
