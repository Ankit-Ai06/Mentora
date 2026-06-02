const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  getUsers,
  sendRequest,
  getRequests,
  acceptRequest,
  getConnections,
  getPlatformStats,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/", getUsers);

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

router.post(
  "/accept/:id",
  protect,
  acceptRequest
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