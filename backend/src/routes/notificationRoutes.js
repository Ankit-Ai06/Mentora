const express = require("express");
const router = express.Router();

const Notification =
require("../models/Notification");

const protect =
require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  async (req, res) => {
    try {

      const notifications =
      await Notification.find({
        receiver: req.user.id
      })
      .populate(
        "sender",
        "fullName email"
      )
      .sort({
        createdAt: -1
      });

      res.json(notifications);

    } catch (err) {

      res.status(500).json({
        message:
        "Failed to fetch notifications"
      });

    }
  }
);

router.put(
  "/read/:id",
  protect,
  async (req, res) => {

    try {

      await Notification.findByIdAndUpdate(
        req.params.id,
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