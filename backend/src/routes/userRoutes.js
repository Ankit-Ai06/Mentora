const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/", protect, getUsers);

router.post(
  "/connect/:id",
  protect,
  sendRequest
);

router.get(
  "/requests",
  protect,
  getRequests
);

router.put(
  "/settings",
  protect,
  updateSettings
);

router.get(
  "/export",
  protect,
  exportMyData
);

router.delete(
  "/me",
  protect,
  deleteMe
);

router.post(
  "/accept/:id",
  protect,
  acceptRequest
);

router.post(
  "/disconnect/:id",
  protect,
  disconnectUser
);

router.post(
  "/ignore/:id",
  protect,
  ignoreRequest
);

router.get(
  "/connections",
  protect,
  getConnections
);

router.get(
  "/stats/platform",
  getPlatformStats
);

module.exports = router;
